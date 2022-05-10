Realm = require('realm');
var fs = require('fs');

var all_dnks_json = JSON.parse(fs.readFileSync('complete2.json', 'utf8'));


const objToArrayRozpodil = (obj) => Object.keys(obj).reduce((acc, key) => [...acc, ...new Array(obj[key]).fill(key)], []);

const base_dna = 'TTCTTTCATGGGGAAGCAGATTTGGGTACCACCCAAGTATTGACTCACCCATCAACAACCGCTATGTATTTCGTACATTACTGCCAGCCACCATGAATATTGTACGGTACCATAAATACTTGACCACCTGTAGTACATAAAAACCCAATCCACATCAAAACCCCCTCCCCATGCTTACAAGCAAGTACAGCAATCAACCCTCAACTATCACACATCAACTGCAACTCCAAAGCCACCCCTCACCCACTAGGATACCAACAAACCTACCCACCCTTAACAGTACATAGTACATAAAGCCATTTACCGTACATAGCACATTACAGTCAAATCCCTTCTCGCCCCCATGGATGACCCCCCTCAGATAGGGGTCCCTTGAC'
const wild_type = 'TTCTTTCATGGGGAAGCAGATTTGGGTACCACCCAAGTATTGACTCACCCATCAACAACCGCTATGTATTTCGTACATTACTGCCAGCCACCATGAATATTGTACGGTACCATAAATACTTGACCACCTGTAGTACATAAAAACCCAATCCACATCAAAACCCCCTCCCCATGCTTACAAGCAAGTACAGCAATCAACCCTCAACTATCACACATCAACTGCAACTCCAAAGCCACCCCTCACCCACTAGGATACCAACAAACCTACCCACCCTTAACAGTACATAGTACATAAAGCCATTTACCGTACATAGCACATTACAGTCAAATCCCTTCTCGTCCCCATGGATGACCCCCCTCAGATAGGGGTCCCTTGAC'

const base_rozpodil_array = objToArrayRozpodil({"0": 2, "1": 31, "2": 61, "3": 62, "4": 37, "5": 28, "6": 18, "7": 18, "8": 3})
const wild_rozpodil_array = objToArrayRozpodil({'0': 28, '1': 59, '2': 61, '3': 40, '4': 31, '5': 18, '6': 19, '7': 4})

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
    const hamming = (str1, str2) => {
        let i = 0, count = 0;
        while (i < str1.length) {
            if (str1[i] != str2[i])
                count++;
            i++;
        }
        return count;
    };

    let getMax = function (str) {
        let max = 0,
            maxChar = '';
        str.split('').forEach(function (char) {
            if (str.split(char).length > max) {
                max = str.split(char).length;
                maxChar = char;
            }
        });
        return maxChar;
    };

    function calc_Expectation(a) {
        let n = a.length
        // Variable prb is for probability of each
        // element which is same for each element
        let prb = (1 / n);

        // calculating expectation overall
        let sum = 0;
        for (let i = 0; i < n; i++)
            sum += a[i] * prb;

        // returning expectation as sum
        return sum;
    }

    function mean(arr, n)
    {
        let sum = 0;

        for (let i = 0; i < n; i++)
            sum = sum + arr[i];
        return sum / n;
    }


    function getStandardDeviation(arr) {
        let sum = 0;
        let n = arr.length
        for (let i = 0; i < n; i++)
            sum = sum + (arr[i] - mean(arr, n)) *
                (arr[i] - mean(arr, n));

        return Math.sqrt(sum / (n - 1));
    }

    const mode = a =>
        Object.values(
            a.reduce((count, e) => {
                if (!(e in count)) {
                    count[e] = [0, e];
                }

                count[e][0]++;
                return count;
            }, {})
        ).reduce((a, v) => v[0] < a[0] ? a : v, [0, null])[1];
    ;


    function coefficientOfVariation(arr)
    {
        let n =  arr.length
        return (getStandardDeviation(arr, n) / mean(arr, n));
    }

    const dnks = realm.objects("DNK");

    const belorussian = dnks.filter(itemFilter => itemFilter.country_short === "BEL")

    //------------ harming

    // const hammingRes = (dna) => belorussian.reduce(
    //     (acc, item) => {
    //         const hammingVal = hamming(item.dna, dna)
    //         const count = !!acc[hammingVal] ? ++acc[hammingVal] : 1
    //         return {[hammingVal]: count, ...acc}
    //     }, {}
    // )

    // console.log(`harming: ${JSON.stringify(hammingRes(base_dna))}`);


    //----------- wild type


    //
    // let res = ""
    // for (let i = 0; i <= 377; ++i) {
    //     let temp = ""
    //     for (let j = 0; j <= belorussian.length; ++j) {
    //
    //         temp += belorussian[j]?.['dna'][i]
    //     }
    //     res += getMax(temp)
    // }
    //
    // console.log(res)


    //---------- hamming Wild

    // console.log(hammingRes(wild_type))


    //---------- mat spodivannya


    console.log(objToArrayRozpodil({'0': 28, '1': 59, '2': 61, '3': 40, '4': 31, '5': 18, '6': 19, '7': 4}))
    // base
    console.log(calc_Expectation(base_rozpodil_array))
    // wild
    console.log(calc_Expectation(wild_rozpodil_array))


    //----------- seredne kvadratychne

    console.log(getStandardDeviation(base_rozpodil_array))
    console.log(getStandardDeviation(wild_rozpodil_array))


    //----------- mode

    console.log(mode(base_rozpodil_array))
    console.log(mode(wild_rozpodil_array))


    //---------- max - min
    console.log(Math.max(...base_rozpodil_array))
    console.log(Math.min(...wild_rozpodil_array))


    //--------- Coefficient of variation

    console.log(coefficientOfVariation(base_rozpodil_array))
    console.log(coefficientOfVariation(wild_rozpodil_array))

}


realm_open()
