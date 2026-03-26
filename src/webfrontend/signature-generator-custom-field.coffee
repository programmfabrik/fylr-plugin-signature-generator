class CustomDataTypeSignatureGenerator extends CustomDataType

    getCustomDataTypeName: ->
        "custom:base.signaturegenerator.signaturegenerator"

    getCustomDataOptionsInDatamodelInfo: (custom_settings) ->
       tags = []

       tags

    supportsStandard: ->
        true

    supportsGeoStandard: ->
        false

    supportsFacet: ->
        true

    getFacet: (opts) ->
        opts.field = @
        new CustomDataTypeSignatureGeneratorFacet(opts)

    initData: (data) ->
        if not data[@name()]
            data[@name()] = {}

    renderDetailOutput: (data, top_level_data, opts) ->
        cdata = data[@name()]

        div = CUI.dom.element("DIV")
        CUI.dom.append(div,
            new CUI.Label
                text: cdata.signature
        )
        return div

    renderEditorInput: (data, top_level_data, opts) ->
        mask_settings = @getCustomMaskSettings()

        hint_key = @FieldSchema._user_hint_loca_key()

        @initData(data)

        cdata = data[@name()]

        # x-button deletion of number (needs a systemright and a mask config!)
        hasDeletionRight = false;
        if ez5.session.hasSystemRight("system.root")
            hasDeletionRight = true
            
        # check system right
        if ez5.session.hasSystemRight("plugin.fylr-plugin-signature-generator.allow_deletion_of_signature")
            if ez5.session.system_rights['plugin.fylr-plugin-signature-generator.allow_deletion_of_signature']['allow_deletion_of_signature'] == true
                # check mask config
                if mask_settings?.allow_manual_edit?.value == true
                    hasDeletionRight = true

        # if not pattern is given in pool --> show as default text-input-field
        onlyManual = true;
        poolID = opts?.data?._pool?.pool?._id             
        if poolID 
            pool = ez5.pools.findPoolById(poolID)
            customData = pool?.data?.pool?.custom_data
            foundEntryInConfig = false;
            # check all keys, that start with "signaturegenerator__"
            for signatureGeneratorKey, signatureGeneratorValue of customData
                if signatureGeneratorKey.startsWith('signaturegenerator__')
                    # check if objecttype exists
                    objecttypeFromPattern = signatureGeneratorKey.split('signaturegenerator__')[1]
                    if objecttypeFromPattern == top_level_data?._objecttype
                        onlyManual = false
                    
        formClass = 'signaturegenerator-input-readonly'
        if onlyManual
            formClass = 'signaturegenerator-input'

        # different label if signature is already generated
        generatedLabel = if cdata.signature? and cdata.signature isnt "" then $$('custom.data.type.signature-generator.field.signature.label') else $$('custom.data.type.signature-generator.field.signature_not_generated_yet')
        if onlyManual
            generatedLabel = ''

        form = new CUI.Form
            data: cdata
            fields: [
                form:
                    label: generatedLabel
                type: CUI.Input
                name: "signature"
                class: formClass
            ]
            onDataChanged: =>
                CUI.Events.trigger
                    node: form
                    type: "editor-changed"
        .start()

        formDiv = CUI.dom.element("DIV")        

        CUI.dom.append(formDiv, form)

        # set input readonly
        if onlyManual == false
            dataField = CUI.dom.matchSelector(formDiv, '.signaturegenerator-input-readonly')[0]
            inputField = CUI.dom.matchSelector(dataField, 'input')[0]
            inputField.readOnly = true;

        xButton = '';
        if hasDeletionRight && ! onlyManual
            xButton = new CUI.Button
                class: 'fylr-plugin-signature-generator-x-button'
                icon_left: new CUI.Icon(class: "fa-times")
                tooltip:
                    text: $$('fylr-plugin-signature-generator-x-button-tooltip')
                onClick: (evt,button) =>
                    # change input css-classes
                    dataField.classList.remove('signaturegenerator-input-readonly')
                    dataField.classList.add('signaturegenerator-input')
                    inputField.readOnly = false

                    domData = CUI.dom.data(dataField, 'element')                            
                    type = domData.__cls

                    # if text_oneline
                    if type == 'Input'
                        # clear value of field
                        domData.setValue('')
                        domData.displayValue()

                        CUI.Events.trigger
                            type: 'data-changed'
                            node: dataField
                            bubble: true
                        CUI.Events.trigger
                            type: 'editor-changed'
                            node: dataField
                            bubble: true
                    
                    # hide button itself
                    button.hide()

        # create layout for splitter
        horizontalLayout = new CUI.HorizontalLayout
          class: "fylr-plugin-signature-generator-hl ez5-field-block"
          center:
            content: formDiv
          right:
            class: "fylr-plugin-signature-generator-hl-right"
            content:
              xButton        

        return horizontalLayout

    getSaveData: (data, save_data, opts) ->
        cdata = data[@name()] or data._template?[@name()] or {}

        cdata._fulltext =
            text: cdata.signature

        cdata._standard =
            text: cdata.signature

        save_data[@name()] = CUI.util.copyObject(cdata, true)
        return

CustomDataType.register(CustomDataTypeSignatureGenerator)