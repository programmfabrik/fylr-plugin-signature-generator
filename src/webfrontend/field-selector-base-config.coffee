class FieldSelectorBaseConfig extends BaseConfigPlugin
  getFieldDefFromParm: (baseConfig,fieldName, def) ->

    if def.plugin_type != "field_selector_pattern_id_field" && def.plugin_type != "field_selector_sequence_id_field" && def.plugin_type != "field_selector_num_field"
      return

    filterTextField = (field) ->
        return field instanceof TextColumn and
            field not instanceof NestedTable and
            field not instanceof NumberColumn and
            field not instanceof LocaTextColumn and
            field?.ColumnSchema?.not_null == true and
            not field.isTopLevelField() and
            not field.insideNested()

    filterNumberField = (field) =>
        return field instanceof NumberColumn and
            field?.ColumnSchema?.not_null == true and
            field.name() != '_id' and
            not field.isTopLevelField() and
            not field.insideNested()

    switch def.plugin_type
        when "field_selector_pattern_id_field"
            field = new ez5.FieldSelector
                form: label: $$("server.config.name.system.signaturegenerator.pattern_id.label")
                name: fieldName
                objecttype_data_key: "sequence_objecttype"
                store_value: "fullname"
                show_name: true
                value: ''
                filter: filterTextField

    switch def.plugin_type
        when "field_selector_sequence_id_field"
            field = new ez5.FieldSelector
                form: label: $$("server.config.name.system.signaturegenerator.sequence_id.label")
                name: fieldName
                objecttype_data_key: "sequence_objecttype"
                store_value: "fullname"
                show_name: true
                filter: filterTextField                

        when "field_selector_num_field"
            field = new ez5.FieldSelector
                form: label: $$("server.config.name.system.signaturegenerator.num_field.label")
                name: fieldName
                objecttype_data_key: "sequence_objecttype"
                store_value: "fullname"
                show_name: true
                filter: filterNumberField    
      
    field

CUI.ready =>
  BaseConfig.registerPlugin(new FieldSelectorBaseConfig())
