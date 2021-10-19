export const gridMinimumFilter = (size, array) => {
    let gridData = {};
    let resultArray = [];
    for (let i = 0; i < array.length; i += 3) {
        let a = array[i] / size;
        let b = array[i + 1] / size;
        if (a < 0 && a > -1) a = '-0';
        else a = parseInt(a)
        if (b < 0 && b > -1) b = '-0';
        else b = parseInt(b)
        var ind = a + '.' + b;
        if (!gridData[ind]) gridData[ind] = [];
        gridData[ind].push(i + 2);
    }
    for (let ind in gridData) {
        let target = gridData[ind][0];
        for (let i = 1; i < gridData[ind].length; i++) {
            if (array[target] > array[gridData[ind][i]]) target = gridData[ind][i];
        }
        resultArray.push(array[target - 2], array[target - 1], array[target]);
    }
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
        if (a < 0 && a > -1) a = '-0';
        else a = parseInt(a)
        if (b < 0 && b > -1) b = '-0';
        else b = parseInt(b)
        if (c < 0 && c > -1) c = '-0';
        else c = parseInt(c)
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


