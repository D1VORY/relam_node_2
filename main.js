Realm = require('realm');
bson = require('bson')
var fs = require('fs');
const { performance } = require('perf_hooks');


const objToArrayRozpodil = (obj) => Object.keys(obj).reduce((acc, key) => [...acc, ...new Array(obj[key]).fill(parseInt(key))], []);

const base_dna = 'TTCTTTCATGGGGAAGCAGATTTGGGTACCACCCAAGTATTGACTCACCCATCAACAACCGCTATGTATTTCGTACATTACTGCCAGCCACCATGAATATTGTACGGTACCATAAATACTTGACCACCTGTAGTACATAAAAACCCAATCCACATCAAAACCCCCTCCCCATGCTTACAAGCAAGTACAGCAATCAACCCTCAACTATCACACATCAACTGCAACTCCAAAGCCACCCCTCACCCACTAGGATACCAACAAACCTACCCACCCTTAACAGTACATAGTACATAAAGCCATTTACCGTACATAGCACATTACAGTCAAATCCCTTCTCGCCCCCATGGATGACCCCCCTCAGATAGGGGTCCCTTGAC'
const base_dna_eva = 'TTCTTTCATGGGGAAGCAGATTTGGGTACCACCCAAGTATTGACTCACCCATCAACAACCGCTATGTATTTCGTACATTACTGCCAGCCACCATGAATATTGTACAGTACCATAAATACTTGACCACCTGTAGTACATAAAAACCCAATCCACATCAAAACCCTCCCCCCATGCTTACAAGCAAGTACAGCAATCAACCTTCAACTGTCACACATCAACTGCAACTCCAAAGCCACCCCTCACCCACTAGGATATCAACAAACCTACCCACCCTTAACAGTACATAGCACATAAAGCCATTTACCGTACATAGCACATTACAGTCAAATCCCTTCTCGTCCCCATGGATGACCCCCCTCAGATAGGGGTCCCTTGAC'


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


const MainTask = {
    name: 'MainTask',
    properties: {
        _id: 'objectId',
        name: 'string?',
        results: 'Result[]'
    },
    primaryKey: '_id',
}

const DistributionValueSchema = {
    name: 'DistributionValue',
    properties: {
        _id: 'objectId',
        'mutations': 'string',
        'quantity': 'int',
    },
    primaryKey: '_id',
};

const ResultSchema = {
    name: 'Result',
    properties: {
        _id: 'objectId',
        task: 'string?',
        mean_squared: 'double?',
        math_expectation: 'double?',
        coeff_variation: 'double?',
        mode: 'int?',
        max: 'int?',
        min: 'int?',
        distribution: 'DistributionValue[]',
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
        schema: [DNKSchema, ResultSchema, DistributionValueSchema, MainTask],
    })
    //await load_from_json(realm)

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

    const log_rozpodil = (hamming_rozpodil, task_name) => {
        const rozpodil_array = objToArrayRozpodil(hamming_rozpodil)
        const data = {
            distribution: Object.keys(hamming_rozpodil).map((key) => ({'_id': bson.ObjectId(), 'mutations': key, 'quantity': hamming_rozpodil[key]})),
            mean_squared : getStandardDeviation(rozpodil_array),
            math_expectation : calc_Expectation(rozpodil_array),
            mode : mode(rozpodil_array),
            min : Math.min(...Object.values(hamming_rozpodil)),
            max : Math.max(...Object.values(hamming_rozpodil)),
            coeff_variation: coefficientOfVariation(rozpodil_array),
            task: task_name
        }
        console.log(`Мат.сподів. ${data.math_expectation}`)
        console.log(`Сер. кв выдхил ${data.mean_squared}`)
        console.log(`мода ${data.mode}`)
        //console.log(`LENGTH: ${rozpodil_array.length}`)
        console.log(`min ${data.min}`)
        console.log(`max ${data.max}`)
        console.log(`Coefficient of variation ${data.coeff_variation}`)
        let result
        realm.write(() => {
          result = realm.create(ResultSchema.name, {_id: bson.ObjectId(), ...data})
        });
        // u
        return result
    }

    const log_all_data = (filtered, main_task_name) => {
        let results = []
        console.log('_____________________________________________________________________________________________')
        console.log(main_task_name)
        //console.log(JSON.stringify(filtered))
        console.log('===================================')
        let subtask = 'Розподіл відносно базової rCRS'
        console.log(subtask)
        let rozpodil_rcrs = hammingRes(base_dna, filtered)
        console.log(JSON.stringify(rozpodil_rcrs))
        results.push(log_rozpodil(rozpodil_rcrs))

        console.log('===================================')
        subtask = 'Розподіл відносно базової RSRS'
        console.log(subtask)
        let rozpodil_rsrs = hammingRes(base_dna_eva, filtered)
        results.push(log_rozpodil(rozpodil_rsrs))

        console.log('===================================')
        subtask = 'Розподіл відносно дикого типу'
        console.log(subtask)
        let wild_type = wild_type_calculate(filtered)
        console.log('ДИКИЙ ТИП: ')
        console.log(wild_type)
        console.log(`Відстань до rCRS ${hamming(wild_type, base_dna)}`)
        console.log(`Відстань до RSRS ${hamming(wild_type, base_dna_eva)}`)
        let rozpodil_wild_type = hammingRes(wild_type, filtered)
        console.log(JSON.stringify(rozpodil_wild_type))
        results.push(log_rozpodil(rozpodil_wild_type))

        console.log('===================================')
        subtask = 'Розподіл відносно попарних'
        console.log(subtask)
        let rozpodil_paired = paired_distances(filtered)
        console.log(JSON.stringify(rozpodil_paired))
        results.push(log_rozpodil(rozpodil_paired))

        let main_task
        realm.write(() => {
          main_task = realm.create(MainTask.name, {_id: bson.ObjectId(), name: main_task_name, results: results})
        });
    }
    const dnks = realm.objects("DNK");
    //1
    var startTime = performance.now()
    let data = dnks.filtered('country_short = "UKR"')
    log_all_data(data, 'UKR')
    var endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    //2
    startTime = performance.now()
    data = dnks.filtered( 'code BEGINSWITH "ZA" or code BEGINSWITH "ST" or code BEGINSWITH "IF"')
    log_all_data(data, 'ZA" "IF')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    //3
    startTime = performance.now()
    data = dnks.filtered( 'code BEGINSWITH "KHM" or code BEGINSWITH "RO" or code BEGINSWITH "CH" or code BEGINSWITH "KHA" or code BEGINSWITH "SU" or code BEGINSWITH "ZH" or code BEGINSWITH "BG"')
    log_all_data(data, '"KHM"  "RO"  "CH"  "KHA"  "SU" "ZH')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    //4
    startTime = performance.now()
    data = dnks.filtered( 'code BEGINSWITH "BRST" or code BEGINSWITH "GML" or code BEGINSWITH "VTB"')
    log_all_data(data, '"BRST"  "GML" "VTB"')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    //5
    startTime = performance.now()
    data = dnks.filtered( 'code BEGINSWITH "PNG" or code BEGINSWITH "KSTR" or code BEGINSWITH "SML" or code BEGINSWITH "BLG"')
    log_all_data(data, '"PNG" "KSTR" "SML"  "BLG"')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)


    //6
    startTime = performance.now()
    data = dnks.filtered( 'code BEGINSWITH "SML" or code BEGINSWITH "BLG"')
    log_all_data(data, '"SML" "BLG"')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    //7
    startTime = performance.now()
    data = dnks.filtered( 'code BEGINSWITH "PNG" or code BEGINSWITH "KSTR"')
    log_all_data(data, '"PNG" "KSTR"')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    //11
    startTime = performance.now()
    dnks.filtered( 'code BEGINSWITH "PNG" or code BEGINSWITH "KSTR" or code BEGINSWITH "SML" or code BEGINSWITH "BLG" or code BEGINSWITH "BRST" or code BEGINSWITH "GML" or code BEGINSWITH "VTB" or country_short = "UKR"')
    log_all_data(data, 'UKR')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    //12
    startTime = performance.now()
    data =  dnks.filtered( 'code BEGINSWITH "PNG" or code BEGINSWITH "KSTR" or code BEGINSWITH "SML" or code BEGINSWITH "BLG" or code BEGINSWITH "BRST" or code BEGINSWITH "GML" or code BEGINSWITH "VTB" or country_short = "UKR"')
    log_all_data(data, '"PNG" "KSTR" SML UKR')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)


    //13
    startTime = performance.now()
    data = dnks.filtered( 'code BEGINSWITH "SML" or code BEGINSWITH "BLG" or code BEGINSWITH "BRST" or code BEGINSWITH "GML" or code BEGINSWITH "VTB" or country_short = "UKR"')
    log_all_data(data, '"SML" "BLG" "BRST"  "GML"  "VTB" "UKR"')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    startTime = performance.now()
    data = dnks.filtered('code BEGINSWITH "ZA" OR code BEGINSWITH "ST" OR  code BEGINSWITH "IF"')
    log_all_data(data)
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)


    startTime = performance.now()
    data = dnks.filtered('code BEGINSWITH "KHM" OR code BEGINSWITH "RO" OR  code BEGINSWITH "CH" OR  code BEGINSWITH "KHA" OR  code BEGINSWITH "SU" OR  code BEGINSWITH "ZH" OR  code BEGINSWITH "BG"')
    log_all_data(data)
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)



    startTime = performance.now()
    data = dnks.filtered('code BEGINSWITH "BRST" and code BEGINSWITH "GML" and code BEGINSWITH "VTB"')
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)

    startTime = performance.now()
    data = dnks.filtered('code BEGINSWITH "PNG" and code BEGINSWITH "KSTR" and code BEGINSWITH "SML" and code BEGINSWITH "KSTR" and code BEGINSWITH "BLG" ')
    log_all_data(data)
    endTime = performance.now()
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)
}


realm_open()
