class ez5.PoolManagerSignatureGenerator extends ez5.PoolPlugin

  getTabs: (tabs) ->
    that = @

    tab = {}
    tab.name = $$('signaturegenerator.pool.manager.tab.headline')
    tab.text = $$('signaturegenerator.pool.manager.tab.headline')
    tab.content = => new CUI.Label
                    text: $$('signaturegenerator.pool.manager.tab.empty_patters_hint')

    # get fields from baseconfig
    baseConfig = ez5.session.getBaseConfig("plugin", "signaturegenerator")
    patterns = baseConfig['signature-generator']?.patterns
    if(patterns)
      # parse all patterns and sort them by objecttype (headers between different OTs)
      patternsByObjecttype = {}
      for patternKey, patternValue of patterns
        objecttype = patternValue.allowed_objecttype
        if !objecttype?
          continue
        patternsByObjecttype[objecttype] ?= []
        patternsByObjecttype[objecttype].push patternValue
  
      # build one block for each objecttype
      objecttypeBlocks = []
      for objecttypesName, pattersOfOneObjecttype of patternsByObjecttype
        fields = []

        # allow only one selected pattern per objecttype for now (radiobuttons per OT)
        # for each pattern of one objecttype build a radiobutton
        radioOptions = [];
        for patternData in pattersOfOneObjecttype
          radioOptions.push
            text: patternData.pattern_id + " (" + patternData.description + ")" + ": " + patternData.pattern
            value: patternData.pattern_id

        newField =
          type: CUI.Options
          name: "signaturegenerator__" + objecttypesName
          class: "signature-generator-pool-pattern-radio-options"
          min_checked: 0
          radio: true
          options: radioOptions

        fields.push newField
        
        objecttypeForm = new CUI.Form
          data: @_pool.data.pool
          name: "custom_data"
          fields: fields

        objecttypeBlock = new CUI.Block
          text: $$('signaturegenerator.pool.manager.tab.objecttype_block_headline') + ' ' + objecttypesName.toUpperCase()
          content: => objecttypeForm.start()

        objecttypeBlocks.push objecttypeBlock

      tab.content = => new CUI.VerticalList
                      content: objecttypeBlocks
      
    tabs.push tab
    
    return tabs

  getSaveData: (save_data) ->
    that = @

    return

Pool.plugins.registerPlugin(ez5.PoolManagerSignatureGenerator)