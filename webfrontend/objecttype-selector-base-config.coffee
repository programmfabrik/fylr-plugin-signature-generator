class ObjecttypeSelectorBaseConfig extends BaseConfigPlugin
  getFieldDefFromParm: (baseConfig, pname, def, parent_def) ->

    if def.plugin_type != "objecttype-selector"
      return

    # list of objecttypes for selection
    objecttypesOptions = []
    for ot in ez5.schema.CURRENT._objecttypes
      value = ot.name
      objectType = new Objecttype(new Table("CURRENT", ot.table_id))
      text = objectType.nameLocalized()
      text += " [#{objectType.name()}]"
      
      objecttypesOptions.push(
        text: text
        value: value
      )   

    field =
        type: CUI.Select
        name: pname
        options: objecttypesOptions
      
    field

CUI.ready =>
  BaseConfig.registerPlugin(new ObjecttypeSelectorBaseConfig())
