# MENS API model and CRUD endpoints generator with "Plop"

See "ployfile.js" for simple breakdown of inputs, actions for the sequalize model generation.

Read more about plop here: https://plopjs.com/


## Schema YML format

Below a sample API schema that contains all practical features we use on our api endpoints:

```yml
name:
  singular: government document
  plural: government documents
endpointPrefix: /api/v1/
fields:
  id: int#
  user_id: int*
  name: string+
  description:
    type: string
    required: true
  created_at: timestamp
```

Few additional markers in simple "type" annotation to be extended with:

- "*" character designates required (i.e: ```user_id: int*```)
- "+" character designates allowNull: false (i.e: ```name: string+```)
- "#" character designates primaryKey (required, allowNull: false and autoIncrement) (i.e: ```id: int#```)


#### Field object properties in the model yml

- ```type```: int/string/text/date/datetime/timestamp/enum
- ```required```: true/false
- ```primaryKey```: true/false
- ```allowNull```: true/false (default: true)
- ```autoIncrement```: true/false
- ```foreignKey```: true/false
- ```references```: (object) all object keys are mirrored directly in the sequalize model
- ```values```: [...]
- ```defaultValue```: ...



## Install Run

- ```npm install```
- ```npm run generate-crud <yml-file-path>```


## Integrate with a new MENS api boilerplate

Review all plopfile.js "modify" type actions and the pattern that are noted in the target files. These files are existing MENS structural files (database helper methods, router files, documentation...). Add the matching patterns to your own MESN boilerplate files (see output-example for a minimal skimmed version of MENS app files).


## TODOS (Future Capabilities)

- [ ] Add feature authRequired: true/false (overall or per endpoint)
- [ ] Add feature endpoint type based enable/disable (i.e: disable delete)
- [ ] Add feature for list returnFields (return object sanitization, so list endpoint only returns id, name, created_at for example)
- [ ] Add same returnFields feature to get single object endpoint's template
- [ ] Add feature for list / pagination: true
- [ ] Add feature for list filter: true
- [ ] Add feature for list sort: true
