> This Plugin / Repo is being maintained by a community of developers.
There is no warranty given or bug fixing guarantee; especially not by
Programmfabrik GmbH. Please use the github issue tracking to report bugs
and self organize bug fixing. Feel free to directly contact the committing
developers.

# fylr-plugin-signature-generator

This is a plugin for [fylr](https://docs.fylr.io/).

## installation

The latest version of this plugin can be found [here](https://github.com/programmfabrik/fylr-plugin-signature-generator/releases/latest/download/signaturegenerator.zip).

The ZIP can be downloaded and installed using the plugin manager, or used directly (recommended).

Github has an overview page to get a list of [all releases](https://github.com/programmfabrik/fylr-plugin-signature-generator/releases/).

## requirements
This plugin requires https://github.com/programmfabrik/fylr-plugin-commons-library. In order to use this Plugin, you need to add the [commons-library-plugin](https://github.com/programmfabrik/fylr-plugin-commons-library) to your pluginmanager.

## configuration
As defined in `manifest.master.yml` this datatype can be configured:

### schema options

There are no specific schema options. In order to use the signature-generator, you need to add a new field of type "signature-generator" on the top level of your objecttypes datamodel. You can only use one signature-generator-field per objecttype.

### mask options

There is an field "allow_manual_edit" in the mask options for the "signature-generator"-field. If you allow this option, users are given the possibility to set the value of the signature manually, like in a default text field. Users can manually remove the generated signature and replace it with a custom value.

Notice: Users will additionally need the corresponding systemright, to perform those manual edits. This increases the security of this powerful feature.

### sequence-objecttype

Most signatures contain an automatically increasing number. To save the last state of this sequences, an extra objecttype is obligatory. The objecttype must follow this rules:
* contain a default single-line, not multilanguage text-field to save the pattern-id. Name it "pattern_id" or something similar
* contain a default single-line, not multilanguage text-field to save the sequence-id. Name it "sequence_id" or something similar
* contain a number-field (integral) to save the sequence-value. Name it "value" or something similar
* all fields must be configured as NOT NULL
* all fields must be editable in the default mask

### pluginconfiguration
In order to use the plugin, you must configure some options and the sequence-patterns in the pluginconfiguration. 

* User for sequence-generation
    * configure a user, which plugin uses to edit the sequence-objecttype. Therefore the user needs all right to create and update the sequence-objecttype. As this happens serverside you are also allowed to use a root-user for easier handling.
* status
    * activate the sequence-generation
* Objecttype for saveing the sequences
    * choose your sequence-objecttype from above
* Textfield for the pattern-ID in objecttype
    * choose your pattern-id-field from above
* Textfield for the sequence-ID in objecttype
    * choose your sequence-id-field from above
* Numberfield for the pattern-sequence in objecttype
    * choose your value-field from above
* configure patterns. A pattern is used to generate a series of signatures
    * Pattern ID
        *   Choose a unique ID for the pattern and never change it, as this would damage the poolconfiguration (see below)
    * Description
        * A description of the signature
    * Allowed Objecttype
        * Choose the objecttype for which the pattern may be used. Each pattern may only be used in one objecctype
    * Pattern
        * a pattern is a series of tokens. Read and follow the [guideline for pattern-syntax](https://github.com/programmfabrik/fylr-plugin-signature-generator/blob/main/readme_patternsyntax.md)). 
    * Variables
        * a token can use a variable to integrate values from the original record into the signature. See the guideline.
    * Sequences
        * a signature can contain multiple sequences with different startvalues and different paddings. Configure them here according to the guideline.

### poolconfiguration
* In the poolconfiguration switch to tab "signature generator" and choose the patterns, which are used for the objecttypes of the pool

## saved data
* pattern (the pattern which was used to generate the signature)
* signature (the generated signature)

## sources
The source code of this plugin is managed in a git repository at <https://github.com/programmfabrik/fylr-plugin-signature-generator>.
