Realm = require('realm');
var fs = require('fs');



const objToArrayRozpodil = (obj) => Object.keys(obj).reduce((acc, key) => [...acc, ...new Array(obj[key]).fill(parseInt(key))], []);

const base_dna = 'TTCTTTCATGGGGAAGCAGATTTGGGTACCACCCAAGTATTGACTCACCCATCAACAACCGCTATGTATTTCGTACATTACTGCCAGCCACCATGAATATTGTACGGTACCATAAATACTTGACCACCTGTAGTACATAAAAACCCAATCCACATCAAAACCCCCTCCCCATGCTTACAAGCAAGTACAGCAATCAACCCTCAACTATCACACATCAACTGCAACTCCAAAGCCACCCCTCACCCACTAGGATACCAACAAACCTACCCACCCTTAACAGTACATAGTACATAAAGCCATTTACCGTACATAGCACATTACAGTCAAATCCCTTCTCGCCCCCATGGATGACCCCCCTCAGATAGGGGTCCCTTGAC'
const base_dna_eva = 'TTCTTTCATGGGGAAGCAGATTTGGGTACCACCCAAGTATTGACTCACCCATCAACAACCGCTATGTATTTCGTACATTACTGCCAGCCACCATGAATATTGTACAGTACCATAAATACTTGACCACCTGTAGTACATAAAAACCCAATCCACATCAAAACCCTCCCCCCATGCTTACAAGCAAGTACAGCAATCAACCTTCAACTGTCACACATCAACTGCAACTCCAAAGCCACCCCTCACCCACTAGGATATCAACAAACCTACCCACCCTTAACAGTACATAGCACATAAAGCCATTTACCGTACATAGCACATTACAGTCAAATCCCTTCTCGTCCCCATGGATGACCCCCCTCAGATAGGGGTCCCTTGAC'
let wild_type = ''

let base_rozpodil_array = null//objToArrayRozpodil({"0": 2, "1": 31, "2": 61, "3": 62, "4": 37, "5": 28, "6": 18, "7": 18, "8": 3})
let wild_rozpodil_array = null //objToArrayRozpodil({'0': 28, '1': 59, '2': 61, '3': 40, '4': 31, '5': 18, '6': 19, '7': 4})


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
        //console.log(arr)
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

    const data = dnks.filtered('country_short = "BEL"')

    //------------ harming

    const hammingRes = (dna, filtered_dnas) => filtered_dnas.reduce(
        (acc, item) => {
            const hammingVal = hamming(item.dna, dna)
            const count = !!acc[hammingVal] ? ++acc[hammingVal] : 1
            return {[hammingVal]: count, ...acc}
        }, {}
    )

    const paired_distances = (filtered_dnas) => {
        let results = {}
        for (let i = 0; i < filtered_dnas.length; i++) {
            const distances = hammingRes(filtered_dnas[i].dna, filtered_dnas.slice(i+1))
            for (const [key, value] of Object.entries(distances)){
                results[key] = (key in results ? results[key] : 0) + value
            }
        }
        return results
    }

    //----------- wild type
    const wild_type_calculate = (filtered_dnas)=>{
        let res = ""
        for (let i = 0; i <= 377; ++i) {
            let temp = ""
            for (let j = 0; j <= filtered_dnas.length; ++j) {

                temp += filtered_dnas[j]?.['dna'][i]
            }
            res += getMax(temp)
        }
        return res
    }
    wild_type = wild_type_calculate(data)
    base_rozpodil_array = objToArrayRozpodil(hammingRes(base_dna,data))
    wild_rozpodil_array = objToArrayRozpodil(hammingRes(wild_type,data))

    const log_rozpodil = (hamming_rozpodil) => {
        const rozpodil_array = objToArrayRozpodil(hamming_rozpodil)
        console.log(`Мат.сподів. ${calc_Expectation(rozpodil_array)}`)
        console.log(`Сер. кв выдхил ${getStandardDeviation(rozpodil_array)}`)
        console.log(`мода ${mode(rozpodil_array)}`)
        //console.log(`LENGTH: ${rozpodil_array.length}`)
        // console.log(`min ${Math.min(...rozpodil_array)}`)
        // console.log(`max ${Math.max(...rozpodil_array)}`)
        console.log(`Coefficient of variation ${coefficientOfVariation(rozpodil_array)}`)
    }

    const log_all_data = (filtered) => {
        console.log('===================================')
        console.log('Розподіл відносно базової rCRS')
        let rozpodil_rcrs = hammingRes(base_dna, filtered)
        console.log(JSON.stringify(rozpodil_rcrs))
        log_rozpodil(rozpodil_rcrs)

        console.log('===================================')
        console.log('Розподіл відносно базової RSRS')
        let rozpodil_rsrs = hammingRes(base_dna_eva, filtered)
        console.log(JSON.stringify(rozpodil_rsrs))
        log_rozpodil(rozpodil_rsrs)


        console.log('===================================')
        console.log('Розподіл відносно дикого типу')
        let wild_type = wild_type_calculate(filtered)
        let rozpodil_wild_type = hammingRes(wild_type, filtered)
        console.log(JSON.stringify(rozpodil_wild_type))
        log_rozpodil(rozpodil_wild_type)

        console.log('===================================')
        console.log('Розподіл відносно попарних')
        let rozpodil_paired = paired_distances(filtered)
        console.log(JSON.stringify(rozpodil_paired))
        log_rozpodil(rozpodil_paired)
    }
    let ukrainians = dnks.filtered('country_short = "UKR"')
    log_all_data(ukrainians)

}


realm_open()
