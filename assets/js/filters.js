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

// export const outlierRemovalFilter = (num, dev, dis, arr) => {
//     if (num > arr.length / 3 - 1) num = arr.length / 3 - 1;
//     var resultArray = [];
//     for (var i = 0; i < arr.length; i += 3) {
//         var disarr = [];
//         for (var j = 0; j < arr.length; j += 3) {
//             if (i !== j) disarr.push(dis[i + '.' + j]);
//         }
//         if (calcuDis(disarr, num) < dev) resultArray.push(arr[i], arr[i + 1], arr[i + 2]);
//     }
//     return resultArray;
// }

// export const calcuDis = (arr, num) => {
//     var dev = 0;
//     for (var i = 0; i < num; i++) {
//         for (var j = i + 1; j < arr.length; j++) {
//             if (arr[i] > arr[j]) arr[i] = [arr[j], arr[j] = arr[i]][0];
//         }
//         dev += arr[i];
//     }
//     return dev / num;
// }
