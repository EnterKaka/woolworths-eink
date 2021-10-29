export const gridMinimumFilter = (size, array) => {
    // startProgress()
    let gridData = {};
    let resultArray = [];
    // var pct = 0;
    // var m = array.length / 3 * 2;
    for (let i = 0; i < array.length; i += 3) {
        let a = array[i] / size;
        let b = array[i + 1] / size;
        a = Math.floor(a);
        b = Math.floor(b);
        var ind = a + '.' + b;
        if (!gridData[ind]) gridData[ind] = [];
        gridData[ind].push(i + 2);
        // pct++;
        // setProgress(pct, m);
    }
    for (let ind in gridData) {
        let target = gridData[ind][0];
        for (let i = 1; i < gridData[ind].length; i++) {
            if (array[target] > array[gridData[ind][i]]) target = gridData[ind][i];
        }
        resultArray.push(array[target - 2], array[target - 1], array[target]);
        // pct++;
        // setProgress(pct, m);
    }
    // finishProgress();
    return resultArray;
}

export const voxelGridFilter = (size, array) => {
    console.log(size)
    let gridData = {};
    let resultArray = [];
    for (let i = 0; i < array.length; i += 3) {
        let a = array[i] / size;
        let b = array[i + 1] / size;
        let c = array[i + 2] / size;
        a = Math.floor(a);
        b = Math.floor(b);
        c = Math.floor(c);
        var ind = a + '.' + b + '.' + c;
        if (!gridData[ind]) gridData[ind] = [];
        gridData[ind].push(i);
    }
    for (let ind in gridData) {
        let target = { x: 0, y: 0, z: 0 };
        for (let i = 0; i < gridData[ind].length; i++) {
            target.x += array[gridData[ind][i]];
            target.y += array[gridData[ind][i] + 1];
            target.z += array[gridData[ind][i] + 2];
        }

        resultArray.push(target.x / gridData[ind].length, target.y / gridData[ind].length, target.z / gridData[ind].length);
    }
    return resultArray;
}

export const outlierRemovalFilter = (num, dev, array) => {
    var distances = {};
    var indexs = [];
    var dev = dev * dev;
    if (num >= array.length / 3) num = array.length - 1;
    var resultArray = [];
    console.log(array.length / 3)
    for (var i = 0; i < array.length - 3; i += 3) {
        for (var j = i + 3; j < array.length; j += 3) {
            distances[i + '.' + j] = Math.pow(array[i] - array[j], 2) + Math.pow(array[i + 1] - array[j + 1], 2) + Math.pow(array[i + 2] - array[j + 2], 2);
            indexs.push(i + '.' + j);
        }
    }
    for (var i = 0; i < indexs.length - 1; i++) {
        for (var j = i + 1; j < indexs.length; j++) {
            if (distances[indexs[i]] > distances[indexs[j]]) indexs[i] = [indexs[j], indexs[j] = indexs[i]][0];
        }
    }
    for (var i = 0; i < array.length / 3; i++) {
        var len = 0, count = 0;
        var pind = i * 3;
        for (var j = 0; j < indexs.length; j++) {
            var ind = indexs[j].split('.');
            if (ind[0] == pind || ind[1] == pind) {
                count++;
                len += distances[indexs[j]];
                if (count == num) break;
            }
            console.log(i, j)
        }
        if ((len / num) < dev) resultArray.push(array[i * 3], array[i * 3 + 1], array[i * 3 + 2]);
    }
    alert("looped completed")
}

export const updatedRemovalFilter = (num, dis, array) => {
    let gridData = {};
    let resultIndex = [];
    let resultArray = [];
    let endInd = -Infinity;
    dis *= dis;

    for (let i = 0; i < array.length; i += 3) {
        let a = array[i] / dis;
        let b = array[i + 1] / dis;
        let c = array[i + 2] / dis;
        a = Math.floor(a);
        b = Math.floor(b);
        c = Math.floor(c);
        var ind = a + '.' + b + '.' + c;
        if (!gridData[ind]) gridData[ind] = [];
        gridData[ind].push(i);
        if (endInd < Math.abs(a)) endInd = Math.abs(a);
        if (endInd < Math.abs(b)) endInd = Math.abs(b);
        if (endInd < Math.abs(c)) endInd = Math.abs(c);
    }

    // console.log(endInd)

    for (let id in gridData) {

        if (gridData[id].length >= num) resultIndex.push(...gridData[id]);
        else {
            let count = 0;
            let wdh = 0;
            let arr1 = gridData[id];
            let arr2 = [];
            let abc = id.split('.');
            let a = abc[0], b = abc[1], c = abc[2];
            let loop = true;
            // console.log('elsed')
            while (loop) {
                wdh++;
                // console.log(wdh)
                if (wdh > endInd) break;
                // console.log(wdh)
                for (let i = -wdh; i <= wdh; i++) {
                    // console.log(i, -wdh, wdh)
                    for (let j = -wdh; j <= wdh; j++) {
                        for (let k = -wdh; k <= wdh; k++) {
                            // console.log('for3ed', i == -wdh, i == wdh, j == -wdh, j == wdh, k == -wdh, k == wdh, i, j, k, wdh)
                            if (i == -wdh || i == wdh || j == -wdh || j == wdh || k == -wdh || k == wdh) {
                                let cid = (i + parseFloat(a)) + '.' + (j + parseFloat(b)) + '.' + (k + parseFloat(c));
                                // console.log(cid)
                                if (gridData[cid]) {
                                    arr2.push(...gridData[cid])
                                    // alert(arr2)
                                    if (arr2.length + arr1.length >= num) {
                                        resultIndex.push(...getIndexs(arr1, arr2, array, dis, num));
                                        loop = false;
                                        break;
                                    }
                                };
                            }
                        }
                        if (!loop) break;
                    }
                    if (!loop) break;
                }


            }

        }
    }

    for (let i = 0; i < resultIndex.length; i++) {
        resultArray.push(array[resultIndex[i]], array[resultIndex[i] + 1], array[resultIndex[i] + 2]);
    }

    return resultArray;

}

function getIndexs(ind1, ind2, array, dis, num) {
    let resultArray = [];
    let celldis = {};
    // console.log('getedIndex')
    let restLoop = num - ind1.length + 1;
    for (let i = 0; i < ind1.length - 1; i++) {
        let alldis = 0;
        for (let j = i + 1; j < ind1.length; j++) {
            alldis += celldis[ind1[i] + '.' + ind1[j]] = celldis[ind1[j] + '.' + ind1[i]] = Math.pow(array[ind1[i]] - array[ind1[j]], 2) + Math.pow(array[ind1[i] + 1] - array[ind1[j] + 1], 2) + Math.pow(array[ind1[i] + 2] - array[ind1[j] + 2], 2);
        }

        for (let j = 0; j < i; j++) {
            alldis += celldis[ind1[i] + '.' + ind1[j]];
        }

        for (let j = 0; j < restLoop; j++) {
            alldis += Math.pow(array[ind1[i]] - array[ind2[j]], 2) + Math.pow(array[ind1[i] + 1] - array[ind2[j] + 1], 2) + Math.pow(array[ind1[i] + 2] - array[ind2[j] + 2], 2);
        }

        if (dis > (alldis / num)) resultArray.push(ind1[i])
    }

    return resultArray;
}

export const passThroughFilter = (pass, limit1, limit2, array) => {
    var resultArray = [];

    if (limit1 > limit2) limit1 = [limit2, limit2 = limit1][0];
    limit1 = limit1 * limit1;
    limit2 = limit2 * limit2;
    if (pass == "x")
        for (var i = 0; i < array.length; i += 3) {
            var dis = Math.pow(array[i + 1], 2) + Math.pow(array[i + 2], 2);
            if (dis > limit1 && dis < limit2) resultArray.push(array[i], array[i + 1], array[i + 2]);
        }
    else if (pass == "y")
        for (var i = 0; i < array.length; i += 3) {
            var dis = Math.pow(array[i], 2) + Math.pow(array[i + 2], 2);
            if (dis > limit1 && dis < limit2) resultArray.push(array[i], array[i + 1], array[i + 2]);
        }
    else if (pass == "z")
        for (var i = 0; i < array.length; i += 3) {
            var dis = Math.pow(array[i], 2) + Math.pow(array[i + 1], 2);
            if (dis > limit1 && dis < limit2) resultArray.push(array[i], array[i + 1], array[i + 2]);
        }
    return resultArray;
}

function startProgress() {
    document.getElementById('fprgs').style.display = "flex";
}

function setProgress(percent, m) {
    document.getElementById('fprgsBar').style.width = percent / m * 100 + "%";
}

function finishProgress() {
    document.getElementById('fprgs').style.display = "none";
}


