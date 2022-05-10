


const realmAppId = "realmlab-xmume";
var express = require('express'),
  bodyParser = require('body-parser'),
  Realm = require('realm');

var app = express();

let PostSchema = {
  name: 'Post',
  properties: {
    timestamp: 'date',
    title: 'string',
    content: 'string'
  }
};

var blogRealm = new Realm({
  path: 'blog.realm',
  schema: [PostSchema]
});

blogRealm.write(() => {
    blogRealm.create('Post', {title: title, content: content, timestamp: timestamp});
  });

// bodyParser = require('body-parser');
// Realm = require('realm');
//
// let PostSchema = {
//   name: 'Post',
//   properties: {
//     timestamp: 'date',
//     title: 'string',
//     content: 'string'
//   }
// };
//
//
// async function openRealm(partitionKey) {
//   const config = {
//     schema: [PostSchema],
//     sync: {
//       partitionValue: partitionKey,
//     },
//   };
//   return Realm.open(config);
// }
//
// async function getRealm(partitionKey) {
//   if (realms[partitionKey] == undefined) {
//     realms[partitionKey] = openRealm(partitionKey);
//   }
//   return realms[partitionKey];
// }
