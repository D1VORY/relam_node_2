Realm = require('realm');
var fs = require('fs');

var all_dnks_json = JSON.parse(fs.readFileSync('complete2.json', 'utf8'));


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

//const app = new Realm.App({id: realmAppId})
// Realm.open({path: "myrealm", schema: [TaskSchema],}).then(
//     (res) =>{kek = res}
// );

//const kek = Realm.open({path: "myrealm", schema: [TaskSchema],}).then(res => res);


const realm_open = async () => {
   let realm = await Realm.open({
    path: "myrealm",
    schema: [TaskSchema, DNKSchema],
  })


  // let task1, task2;
  //  realm.write(() => {
  //    all_dnks_json.map((obj, i) => {
  //       realm.create(DNKSchema.name, {
  //         _id: i,
  //         ...obj
  //       });
  //    })
  //  })
  //
  // realm.write(() => {
  //   task1 = realm.create("Task", {
  //     _id: 1,
  //     name: "go grocery shopping",
  //     status: "Open",
  //   });
  //   task2 = realm.create("Task", {
  //     _id: 2,
  //     name: "go exercise",
  //     status: "Open",
  //   });
  //   console.log(`created two tasks: ${task1.name} & ${task2.name}`);
  // });

  const dnks = realm.objects("DNK");
  console.log(`The lists of tasks are: ${dnks.map((task) => (JSON.stringify(task)))}`);
}

realm_open()
