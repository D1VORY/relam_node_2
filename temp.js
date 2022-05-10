Realm = require('realm');
var fs = require('fs');



const TaskSchema = {
  name: "Task",
  properties: {
    _id: "int",
    name: "string",
    status: "string?",
  },
  primaryKey: "_id",
};

const DNKSchema = {
  name: 'DNK',
  properties: {
    _id: 'int',
    code: 'string?',
    country: 'string?',
    country_short: 'string?',
    dna: 'string?',
    dna_length: 'int?',
    haplogroup: 'string?',
    id: 'string?',
    isolation_source: 'string?',
    version: 'string?',
  },
  primaryKey: '_id',
};


async function load_from_json(rlm){
  var all_dnks_json = JSON.parse(fs.readFileSync('complete2.json', 'utf8'));
   rlm.write(() => {
     all_dnks_json.map((obj, i) => {
        rlm.create(DNKSchema.name, {
          _id: i,
          ...obj
        });
     })
   })
}

const realm_open = async () => {
   let realm = await Realm.open({
    path: "myrealm",
    schema: [TaskSchema, DNKSchema],
  })
  //await load_from_json(realm)
  const dnks = realm.objects("DNK");
  console.log(`The lists of tasks are: ${dnks.map((task) => (JSON.stringify(task)))}`);
}

realm_open()
