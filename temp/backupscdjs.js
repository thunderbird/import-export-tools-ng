// backup scheme

// full bk intervals
let fbs = [1, 2, 4, 6, 8, 10, 12, 16, 20, 28];
let dbs = [];


for (let index = 0; index < fbs.length; index++) {

  for (let diffint = 1; diffint < fbs[index] ; diffint++) {
    if (fbs[index] == 1 || diffint == fbs[index]) {
      break;
    }
    if (fbs[index] % diffint == 0) {
      dbs.push(diffint);
    }

  }
  console.log("backup interval:", fbs[index], "diff intervals:", dbs)
  dbs = []

}