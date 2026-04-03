(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/agari/index.js
  var require_agari = __commonJS({
    "node_modules/agari/index.js"(exports2, module2) {
      (() => {
        "use strict";
        const sum = (arr) => {
          let s = 0;
          for (let i = 0; i < arr.length; i++)
            s += arr[i];
          return s;
        };
        const check7 = (hai_arr) => {
          let arr = [...hai_arr[0], ...hai_arr[1], ...hai_arr[2], ...hai_arr[3]];
          let s = 0;
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] && arr[i] != 2) return false;
            s += arr[i];
          }
          return s == 14;
        };
        const check13 = (hai_arr) => {
          let arr = [hai_arr[0][0], hai_arr[0][8], hai_arr[1][0], hai_arr[1][8], hai_arr[2][0], hai_arr[2][8], ...hai_arr[3]];
          return !arr.includes(0) && sum(arr) == 14;
        };
        const _check = (arr, is_jihai = false) => {
          arr = [...arr];
          let s = sum(arr);
          if (s === 0)
            return true;
          if (s % 3 == 2) {
            for (let i = 0; i < arr.length; i++) {
              if (arr[i] >= 2)
                arr[i] -= 2;
              else
                continue;
              if (!_check(arr, is_jihai))
                arr[i] += 2;
              else
                return true;
            }
            return false;
          }
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] === 0) {
              continue;
            } else if (arr[i] === 3) {
              delete arr[i];
              continue;
            } else {
              if (is_jihai || i >= 7)
                return false;
              if (arr[i] === 4)
                arr[i] -= 3;
              arr[i + 1] -= arr[i];
              arr[i + 2] -= arr[i];
              if (arr[i + 1] < 0 || arr[i + 2] < 0)
                return false;
              arr[i] = 0;
            }
          }
          return true;
        };
        const check = (hai_arr) => {
          let j = 0;
          for (let i = 0; i < hai_arr.length; i++) {
            if (sum(hai_arr[i]) % 3 === 1)
              return false;
            j += sum(hai_arr[i]) % 3 === 2;
          }
          return j === 1 && _check(hai_arr[3], true) && _check(hai_arr[0]) && _check(hai_arr[1]) && _check(hai_arr[2]);
        };
        const checkAll = (hai_arr) => {
          return check7(hai_arr) || check13(hai_arr) || check(hai_arr);
        };
        const MPSZ2 = ["m", "p", "s", "z"];
        const sumAll = (hai_arr) => {
          let s = 0;
          for (let arr of hai_arr)
            s += sum(arr);
          return s;
        };
        const findKotsu = (hai_arr) => {
          let res2 = [];
          for (let i = 0; i < hai_arr.length; i++) {
            for (let ii = 0; ii < hai_arr[i].length; ii++) {
              if (hai_arr[i][ii] >= 3) {
                hai_arr[i][ii] -= 3;
                if (check(hai_arr)) {
                  res2.push([ii + 1 + MPSZ2[i]]);
                } else {
                  hai_arr[i][ii] += 3;
                }
              }
            }
          }
          return res2;
        };
        const findJyuntsu = (hai_arr) => {
          let res2 = [];
          for (let i = 0; i < hai_arr.length; i++) {
            if (i === 3)
              break;
            for (let ii = 0; ii < hai_arr[i].length; ii++) {
              while (hai_arr[i][ii] >= 1 && hai_arr[i][ii + 1] >= 1 && hai_arr[i][ii + 2] >= 1) {
                hai_arr[i][ii]--;
                hai_arr[i][ii + 1]--;
                hai_arr[i][ii + 2]--;
                if (check(hai_arr)) {
                  res2.push([ii + 1 + MPSZ2[i], ii + 2 + MPSZ2[i], ii + 3 + MPSZ2[i]]);
                } else {
                  hai_arr[i][ii]++;
                  hai_arr[i][ii + 1]++;
                  hai_arr[i][ii + 2]++;
                  break;
                }
              }
            }
          }
          return res2;
        };
        const findJyanto = (hai_arr) => {
          for (let i = 0; i < hai_arr.length; i++) {
            for (let ii = 0; ii < hai_arr[i].length; ii++) {
              if (hai_arr[i][ii] >= 2) {
                return ii + 1 + MPSZ2[i];
              }
            }
          }
        };
        let res = [];
        const calc = (hai_arr, j) => {
          let tmp_hai_arr = [[...hai_arr[0]], [...hai_arr[1]], [...hai_arr[2]], [...hai_arr[3]]];
          let first_res = findKotsu(tmp_hai_arr).concat(j);
          if (sumAll(tmp_hai_arr) === 2) {
            res.push(first_res.sort());
          } else if (first_res.length > 0) {
            first_res = first_res.concat(findJyuntsu(tmp_hai_arr));
            res.push(first_res.sort());
          }
          tmp_hai_arr = [[...hai_arr[0]], [...hai_arr[1]], [...hai_arr[2]], [...hai_arr[3]]];
          let second_res = findJyuntsu(tmp_hai_arr).concat(j);
          if (sumAll(tmp_hai_arr) === 2) {
            res.push(second_res.sort());
          } else {
            second_res = second_res.concat(findKotsu(tmp_hai_arr));
            res.push(second_res.sort());
          }
        };
        const findAllAgariPatterns = (hai_arr) => {
          hai_arr = [[...hai_arr[0]], [...hai_arr[1]], [...hai_arr[2]], [...hai_arr[3]]];
          res = [];
          if (!check(hai_arr)) {
            return res;
          }
          if (sumAll(hai_arr) === 2) {
            res.push([findJyanto(hai_arr)]);
            return res;
          }
          let j;
          for (let i = 0; i < hai_arr[3].length; i++) {
            if (hai_arr[3][i] === 0) {
              hai_arr[3][i] += 2;
              j = i;
              break;
            }
          }
          for (let i = 0; i < hai_arr.length; i++) {
            for (let ii = 0; ii < hai_arr[i].length; ii++) {
              if (i === 3 && ii === j)
                continue;
              if (hai_arr[i][ii] >= 2) {
                hai_arr[i][ii] -= 2;
                if (check(hai_arr))
                  calc(hai_arr, ii + 1 + MPSZ2[i]);
                hai_arr[i][ii] += 2;
              }
            }
          }
          let final_res = [];
          for (let v of res) {
            let is_duplicate = false;
            for (let vv of final_res) {
              if (JSON.stringify(v) === JSON.stringify(vv))
                is_duplicate = true;
            }
            if (!is_duplicate)
              final_res.push(v);
          }
          return final_res;
        };
        const exports3 = findAllAgariPatterns;
        exports3.check = check;
        exports3.check7 = check7;
        exports3.check13 = check13;
        exports3.checkAll = checkAll;
        if (typeof module2 === "object" && module2 && module2.exports) {
          module2.exports = exports3;
        } else if (typeof define === "function" && define.amd) {
          define(() => {
            return exports3;
          });
        } else if (typeof self === "object" && self) {
          self.agari = exports3;
        }
      })();
    }
  });

  // node_modules/syanten/index.js
  var require_syanten = __commonJS({
    "node_modules/syanten/index.js"(exports2, module2) {
      (() => {
        "use strict";
        const sum = (arr) => {
          let s = 0;
          for (let i = 0; i < arr.length; i++)
            s += arr[i];
          return s;
        };
        const syanten2 = (hai_arr) => {
          let res = 9;
          let mentsu, tatsu, alone, furo;
          mentsu = tatsu = alone = furo = 0;
          const search = (arr2, is_jihai = false) => {
            const searchHelper = (arr3, index, is_jihai2 = false, mentsu2, tatsu2, alone2) => {
              let tmp2 = [0, 0, 0];
              let max = [mentsu2, tatsu2, alone2];
              if (index === (is_jihai2 ? 7 : 9)) {
                return max;
              }
              if (arr3[index] === 0) {
                tmp2 = searchHelper(arr3, index + 1, is_jihai2, mentsu2, tatsu2, alone2);
                if (tmp2 > max) {
                  max = tmp2;
                }
              }
              if (arr3[index] >= 3) {
                arr3[index] -= 3;
                tmp2 = searchHelper(arr3, index, is_jihai2, mentsu2 + 1, tatsu2, alone2);
                if (tmp2 > max) {
                  max = tmp2;
                }
                arr3[index] += 3;
              }
              if (arr3[index] >= 2) {
                arr3[index] -= 2;
                tmp2 = searchHelper(arr3, index, is_jihai2, mentsu2, tatsu2 + 1, alone2);
                if (tmp2 > max) {
                  max = tmp2;
                }
                arr3[index] += 2;
              }
              if (arr3[index] >= 1) {
                arr3[index] -= 1;
                tmp2 = searchHelper(arr3, index, is_jihai2, mentsu2, tatsu2, alone2 + 1);
                if (tmp2 > max) {
                  max = tmp2;
                }
                arr3[index] += 1;
              }
              if (!is_jihai2) {
                if (arr3[index] > 0 && arr3[index + 1] > 0 && arr3[index + 2] > 0) {
                  arr3[index]--, arr3[index + 1]--, arr3[index + 2]--;
                  tmp2 = searchHelper(arr3, index, is_jihai2, mentsu2 + 1, tatsu2, alone2);
                  if (tmp2 > max) {
                    max = tmp2;
                  }
                  arr3[index]++, arr3[index + 1]++, arr3[index + 2]++;
                }
                if (arr3[index] > 0 && arr3[index + 2] > 0) {
                  arr3[index]--, arr3[index + 2]--;
                  tmp2 = searchHelper(arr3, index, is_jihai2, mentsu2, tatsu2 + 1, alone2);
                  if (tmp2 > max) {
                    max = tmp2;
                  }
                  arr3[index]++, arr3[index + 2]++;
                }
                if (arr3[index] > 0 && arr3[index + 1] > 0) {
                  arr3[index]--, arr3[index + 1]--;
                  tmp2 = searchHelper(arr3, index, is_jihai2, mentsu2, tatsu2 + 1, alone2);
                  if (tmp2 > max) {
                    max = tmp2;
                  }
                  arr3[index]++, arr3[index + 1]++;
                }
              }
              return max;
            };
            let tmp = searchHelper(arr2, 0, is_jihai, 0, 0, 0);
            mentsu += tmp[0], tatsu += tmp[1], alone += tmp[2];
          };
          const calc = () => {
            let tmp_res = -1;
            while (mentsu < 4 - furo) {
              if (tatsu && alone) {
                tatsu--, alone--, mentsu++, tmp_res++;
                continue;
              }
              if (tatsu && !alone) {
                tatsu--, alone++, mentsu++, tmp_res++;
                continue;
              }
              if (!tatsu && alone) {
                alone -= 2, mentsu++, tmp_res += 2;
              }
            }
            if (alone > 0) tmp_res++;
            res = tmp_res < res ? tmp_res : res;
            mentsu = tatsu = alone = 0;
          };
          hai_arr = [[...hai_arr[0]], [...hai_arr[1]], [...hai_arr[2]], [...hai_arr[3]]];
          let arr = [...hai_arr[0], ...hai_arr[1], ...hai_arr[2], ...hai_arr[3]];
          let s = sum(arr);
          if (s > 14 || s % 3 === 0)
            return -2;
          furo = Math.round((14 - s) / 3);
          if (s % 3 === 1) {
            for (let i = 33; ; i--) {
              if (!arr[i]) {
                arr[i]++;
                hai_arr[Math.floor(i / 9)][i % 9]++;
                break;
              }
            }
          }
          for (let i = 0; i < 34; i++) {
            if (arr[i] === 0)
              continue;
            let t = [];
            t[0] = [...hai_arr[0]], t[1] = [...hai_arr[1]], t[2] = [...hai_arr[2]], t[3] = [...hai_arr[3]];
            t[Math.floor(i / 9)][i % 9] -= arr[i] >= 2 ? 2 : arr[i];
            search(t[0]);
            search(t[1]);
            search(t[2]);
            search(t[3], true);
            calc();
          }
          return res;
        };
        const syanten7 = (hai_arr) => {
          let cnt = sum(hai_arr[0]) + sum(hai_arr[1]) + sum(hai_arr[2]) + sum(hai_arr[3]);
          if (cnt < 13 || cnt > 14)
            return -2;
          let arr = [...hai_arr[0], ...hai_arr[1], ...hai_arr[2], ...hai_arr[3]];
          let s = 0, t = 0;
          for (let i = 0; i < 34; i++) {
            if (arr[i] >= 2) s++;
            if (arr[i] === 1) t++;
          }
          if (s + t >= 7)
            return 6 - s;
          else
            return 6 - s + (7 - s - t);
        };
        const syanten13 = (hai_arr) => {
          let cnt = sum(hai_arr[0]) + sum(hai_arr[1]) + sum(hai_arr[2]) + sum(hai_arr[3]);
          if (cnt < 13 || cnt > 14)
            return -2;
          let arr = [hai_arr[0][0], hai_arr[0][8], hai_arr[1][0], hai_arr[1][8], hai_arr[2][0], hai_arr[2][8], ...hai_arr[3]];
          let s = 0, t = 0;
          for (let i = 0; i < 13; i++) {
            if (arr[i]) s++;
            if (arr[i] > 1) t = 1;
          }
          return 13 - s - t;
        };
        const syantenAll = (hai_arr) => {
          let s7 = syanten7(hai_arr);
          let s13 = syanten13(hai_arr);
          if (s7 === -2 || s13 === -2)
            return syanten2(hai_arr);
          else
            return Math.min(syanten2(hai_arr), s7, s13);
        };
        const MPSZ2 = ["m", "p", "s", "z"];
        const hairi = (hai_arr, is7or13 = false) => {
          let syantenCalc = !is7or13 ? syanten2 : (haiArr) => {
            return Math.min(syanten7(haiArr), syanten13(haiArr));
          };
          let sht = syantenCalc(hai_arr);
          let res = { now: sht };
          if (sht < 0)
            return res;
          let self2 = [];
          const calcHairi = () => {
            let map = {};
            for (let i = 0; i < 4; i++) {
              for (let ii = 0; ii < 9; ii++) {
                if (hai_arr[i][ii] === void 0)
                  continue;
                if (i === self2[0] && ii === self2[1])
                  continue;
                if (!is7or13 && i == 3 && hai_arr[i][ii] === 0)
                  continue;
                if (!is7or13 && i < 3 && (hai_arr[i][ii] === 0 && !hai_arr[i][ii - 1] === 0 && !hai_arr[i][ii - 2] === 0 && !hai_arr[i][ii + 1] === 0 && !hai_arr[i][ii + 1] === 0))
                  continue;
                hai_arr[i][ii]++;
                if (syantenCalc(hai_arr) < sht) {
                  map[ii + 1 + MPSZ2[i]] = 5 - hai_arr[i][ii];
                }
                hai_arr[i][ii]--;
              }
            }
            return map;
          };
          if ((sum(hai_arr[0]) + sum(hai_arr[1]) + sum(hai_arr[2]) + sum(hai_arr[3])) % 3 === 1) {
            res.wait = calcHairi();
            return res;
          }
          for (let i = 0; i < 4; i++) {
            for (let ii = 0; ii < 9; ii++) {
              if (hai_arr[i][ii] === 0 || hai_arr[i][ii] === void 0)
                continue;
              hai_arr[i][ii]--;
              if (syantenCalc(hai_arr) === sht) {
                self2 = [i, ii];
                res[ii + 1 + MPSZ2[i]] = calcHairi();
              }
              hai_arr[i][ii]++;
            }
          }
          return res;
        };
        const exports3 = syantenAll;
        exports3.syanten = syanten2;
        exports3.syanten7 = syanten7;
        exports3.syanten13 = syanten13;
        exports3.syantenAll = syantenAll;
        exports3.hairi = hairi;
        if (typeof module2 === "object" && module2 && module2.exports) {
          module2.exports = exports3;
        } else if (typeof define === "function" && define.amd) {
          define(() => {
            return exports3;
          });
        } else if (typeof self === "object" && self) {
          self.syanten = exports3;
        }
      })();
    }
  });

  // assert-shim.js
  var require_assert_shim = __commonJS({
    "assert-shim.js"(exports2, module2) {
      function deepEqual(a, b) {
        if (a === b) return true;
        if (typeof a !== typeof b) return false;
        if (Array.isArray(a) && Array.isArray(b)) {
          if (a.length !== b.length) return false;
          for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
          }
          return true;
        }
        if (typeof a === "object" && a !== null && b !== null) {
          const ka = Object.keys(a), kb = Object.keys(b);
          if (ka.length !== kb.length) return false;
          for (const k of ka) {
            if (!deepEqual(a[k], b[k])) return false;
          }
          return true;
        }
        return false;
      }
      function assert(val, msg) {
        if (!val) throw new Error(msg || "Assertion failed");
      }
      assert.deepStrictEqual = function(a, b, msg) {
        if (!deepEqual(a, b)) throw new Error(msg || "deepStrictEqual failed");
      };
      module2.exports = assert;
    }
  });

  // node_modules/riichi/yaku.js
  var require_yaku = __commonJS({
    "node_modules/riichi/yaku.js"(exports2, module2) {
      "use strict";
      var assert = require_assert_shim();
      var agari2 = require_agari();
      var MPSZ2 = ["m", "p", "s", "z"];
      var checkAllowed = (o, allowed) => {
        for (let v of o.hai)
          if (!allowed.includes(v))
            return false;
        for (let v of o.furo)
          for (let vv of v)
            if (!allowed.includes(vv))
              return false;
        return true;
      };
      var checkChanta = (o, allow) => {
        let hasJyuntsu = false;
        for (let v of o.currentPattern) {
          if (typeof v === "string") {
            if (!allow.includes(v))
              return false;
          } else if (v.length <= 2 || v[0] === v[1]) {
            if (!allow.includes(v[0]))
              return false;
          } else {
            hasJyuntsu = true;
            let add = parseInt(v[0]) + parseInt(v[1]) + parseInt(v[2]);
            if (add > 6 && add < 24)
              return false;
          }
        }
        return hasJyuntsu;
      };
      var checkYakuhai = (o, pos) => {
        for (let v of o.currentPattern) {
          if (typeof v !== "string" && v[0] === pos + "z")
            return true;
        }
        return false;
      };
      var YAKU2 = {
        "\u56FD\u58EB\u7121\u53CC\u5341\u4E09\u9762\u5F85\u3061": { "yakuman": 2, "isMenzenOnly": true, "check": (o) => {
          return agari2.check13(o.haiArray) && o.hai.reduce((total, v) => {
            return v === o.agari ? ++total : total;
          }, 0) === 2;
        } },
        "\u56FD\u58EB\u7121\u53CC": { "yakuman": 1, "isMenzenOnly": true, "check": (o) => {
          return agari2.check13(o.haiArray) && o.hai.reduce((total, v) => {
            return v === o.agari ? ++total : total;
          }, 0) === 1;
        } },
        "\u7D14\u6B63\u4E5D\u84EE\u5B9D\u71C8": { "yakuman": 2, "isMenzenOnly": true, "check": (o) => {
          let i = MPSZ2.indexOf(o.agari[1]);
          let arr = o.haiArray[i].concat();
          if (arr[0] < 3 || arr[8] < 3 || arr.includes(0))
            return false;
          return [2, 4].includes(arr[parseInt(o.agari) - 1]);
        } },
        "\u4E5D\u84EE\u5B9D\u71C8": { "yakuman": 1, "isMenzenOnly": true, "check": (o) => {
          let i = MPSZ2.indexOf(o.agari[1]);
          let arr = o.haiArray[i].concat();
          if (arr[0] < 3 || arr[8] < 3 || arr.includes(0))
            return false;
          return [1, 3].includes(arr[parseInt(o.agari) - 1]);
        } },
        "\u56DB\u6697\u523B\u5358\u9A0E\u5F85\u3061": { "yakuman": 2, "isMenzenOnly": true, "check": (o) => {
          let res = 0;
          for (let v of o.currentPattern) {
            if (typeof v === "string" && v !== o.agari)
              return false;
            if (typeof v !== "string" && v.length <= 2)
              res++;
          }
          return res === 4;
        } },
        "\u56DB\u6697\u523B": { "yakuman": 1, "isMenzenOnly": true, "check": (o) => {
          let res = 0;
          for (let v of o.currentPattern) {
            if (typeof v === "string" && v === o.agari)
              return false;
            if (typeof v !== "string" && v.length <= 2)
              res++;
          }
          return res === 4;
        } },
        "\u5927\u56DB\u559C": { "yakuman": 2, "check": (o) => {
          let need = ["1z", "2z", "3z", "4z"];
          let res = 0;
          for (let v of o.currentPattern) {
            if (typeof v === "object" && need.includes(v[0]))
              res++;
          }
          return res === 4;
        } },
        "\u5C0F\u56DB\u559C": { "yakuman": 1, "check": (o) => {
          let need = ["1z", "2z", "3z", "4z"];
          let res = 0;
          for (let v of o.currentPattern) {
            if (typeof v === "string" && !need.includes(v))
              return false;
            if (typeof v === "object" && need.includes(v[0]))
              res++;
          }
          return res === 3;
        } },
        "\u5927\u4E09\u5143": { "yakuman": 1, "check": (o) => {
          let need = ["5z", "6z", "7z"];
          let res = 0;
          for (let v of o.currentPattern) {
            if (typeof v === "object" && need.includes(v[0]))
              res++;
          }
          return res === 3;
        } },
        "\u5B57\u4E00\u8272": { "yakuman": 1, "check": (o) => {
          let allow = ["1z", "2z", "3z", "4z", "5z", "6z", "7z"];
          return checkAllowed(o, allow);
        } },
        "\u7DD1\u4E00\u8272": { "yakuman": 1, "check": (o) => {
          let allow = ["2s", "3s", "4s", "6s", "8s", "6z"];
          return checkAllowed(o, allow);
        } },
        "\u6E05\u8001\u982D": { "yakuman": 1, "check": (o) => {
          let allow = ["1m", "9m", "1p", "9p", "1s", "9s"];
          return checkAllowed(o, allow);
        } },
        "\u56DB\u69D3\u5B50": { "yakuman": 1, "check": (o) => {
          let res = 0;
          for (let v of o.currentPattern)
            if (typeof v !== "string" && (v.length === 2 || v.length === 4))
              res++;
          return res === 4;
        } },
        "\u5929\u548C": { "yakuman": 1, "isMenzenOnly": true, "check": (o) => {
          return o.extra.includes("t") && o.isTsumo && o.isOya && !o.furo.length;
        } },
        "\u5730\u548C": { "yakuman": 1, "isMenzenOnly": true, "check": (o) => {
          return o.extra.includes("t") && o.isTsumo && !o.isOya && !o.furo.length;
        } },
        "\u4EBA\u548C": { "yakuman": 1, "isMenzenOnly": true, "isLocal": true, "check": (o) => {
          return o.extra.includes("t") && !o.isTsumo && !o.isOya && !o.furo.length;
        } },
        "\u5927\u4E03\u661F": { "yakuman": 1, "isMenzenOnly": true, "isLocal": true, "check": (o) => {
          let allow = ["1z", "2z", "3z", "4z", "5z", "6z", "7z"];
          return checkAllowed(o, allow) && YAKU2["\u4E03\u5BFE\u5B50"].check(o);
        } },
        "\u6E05\u4E00\u8272": { "han": 6, "isFuroMinus": true, "check": (o) => {
          let must = o.agari[1];
          let allow = [];
          for (let i = 1; i <= 9; i++)
            allow.push(i + must);
          return checkAllowed(o, allow);
        } },
        "\u6DF7\u4E00\u8272": { "han": 3, "isFuroMinus": true, "check": (o) => {
          let allow = ["1z", "2z", "3z", "4z", "5z", "6z", "7z"];
          let d = "";
          for (let v of o.hai) {
            if (["m", "p", "s"].includes(v[1])) {
              d = v[1];
              break;
            }
          }
          if (!d) {
            for (let v of o.furo) {
              for (let vv of v) {
                if (["m", "p", "s"].includes(vv[1])) {
                  d = vv[1];
                  break;
                }
              }
            }
          }
          if (!d)
            return false;
          for (let i = 1; i <= 9; i++)
            allow.push(i + d);
          return checkAllowed(o, allow) && !YAKU2["\u6E05\u4E00\u8272"].check(o);
        } },
        "\u4E8C\u76C3\u53E3": { "han": 3, "isMenzenOnly": true, "check": (o) => {
          let arr = [];
          for (let v of o.currentPattern) {
            if (typeof v === "string")
              continue;
            if (v.length !== 3 || v[0] === v[1])
              return false;
            arr.push(v[0]);
          }
          return arr[0] + arr[2] === arr[1] + arr[3];
        } },
        "\u7D14\u5168\u5E2F\u4E48\u4E5D": { "han": 3, "isFuroMinus": true, "check": (o) => {
          let allow = ["1m", "9m", "1p", "9p", "1s", "9s"];
          return checkChanta(o, allow);
        } },
        "\u6DF7\u5168\u5E2F\u4E48\u4E5D": { "han": 2, "isFuroMinus": true, "check": (o) => {
          let allow = ["1m", "9m", "1p", "9p", "1s", "9s", "1z", "2z", "3z", "4z", "5z", "6z", "7z"];
          return checkChanta(o, allow) && !YAKU2["\u7D14\u5168\u5E2F\u4E48\u4E5D"].check(o);
        } },
        "\u5BFE\u3005\u548C": { "han": 2, "check": (o) => {
          let res = 0;
          for (let v of o.currentPattern)
            if (v.length === 1 || v[0] === v[1])
              res++;
          return res === 4;
        } },
        "\u6DF7\u8001\u982D": { "han": 2, "check": (o) => {
          let allow = ["1m", "9m", "1p", "9p", "1s", "9s", "1z", "2z", "3z", "4z", "5z", "6z", "7z"];
          return checkAllowed(o, allow);
        } },
        "\u4E09\u69D3\u5B50": { "han": 2, "check": (o) => {
          let res = 0;
          for (let v of o.currentPattern)
            if (typeof v !== "string" && (v.length === 2 || v.length === 4))
              res++;
          return res === 3;
        } },
        "\u5C0F\u4E09\u5143": { "han": 2, "check": (o) => {
          let need = ["5z", "6z", "7z"];
          let res = 0;
          for (let v of o.currentPattern) {
            if (typeof v === "string" && !need.includes(v))
              return false;
            if (typeof v === "object" && need.includes(v[0]))
              res++;
          }
          return res === 2;
        } },
        "\u4E09\u8272\u540C\u523B": { "han": 2, "check": (o) => {
          let res = [0, 0, 0, 0, 0, 0, 0, 0, 0];
          for (let v of o.currentPattern) {
            if ((v.length === 1 || v[0] === v[1]) && !v[0].includes("z"))
              res[parseInt(v[0]) - 1]++;
            else
              continue;
          }
          return res.includes(3);
        } },
        "\u4E09\u6697\u523B": { "han": 2, "check": (o) => {
          let res = 0;
          for (let v of o.currentPattern)
            if (typeof v !== "string" && v.length <= 2)
              res++;
          return res === 3;
        } },
        "\u4E03\u5BFE\u5B50": { "han": 2, "isMenzenOnly": true, "check": (o) => {
          return agari2.check7(o.haiArray) && !YAKU2["\u4E8C\u76C3\u53E3"].check(o);
        } },
        "\u30C0\u30D6\u30EB\u7ACB\u76F4": { "han": 2, "isMenzenOnly": true, "check": (o) => {
          return o.extra.includes("w") && !o.furo.length;
        } },
        "\u4E00\u6C17\u901A\u8CAB": { "han": 2, "isFuroMinus": true, "check": (o) => {
          let res = [0, 0, 0, 0, 0, 0, 0, 0, 0];
          for (let v of o.currentPattern) {
            if (v.length <= 2 || v[0] === v[1])
              continue;
            if ([1, 4, 7].includes(parseInt(v[0]))) {
              let i = MPSZ2.indexOf(v[0][1]) * 3 + (parseInt(v[0]) - 1) / 3;
              res[i]++;
            }
          }
          return res[0] && res[1] && res[2] || res[3] && res[4] && res[5] || res[6] && res[7] && res[8];
        } },
        "\u4E09\u8272\u540C\u9806": { "han": 2, "isFuroMinus": true, "check": (o) => {
          let res = [];
          for (let v of o.currentPattern) {
            if (v.length <= 2 || v[0] === v[1] || v[0].includes("z")) continue;
            let value = parseInt(v[0]);
            res[value] = res[value] ? res[value] : /* @__PURE__ */ new Set();
            res[value].add(v[0][1]);
          }
          return res.some((value) => value.size === 3);
        } },
        "\u65AD\u4E48\u4E5D": { "han": 1, "check": (o) => {
          for (let v of o.furo)
            if (!o.allowKuitan && v.length !== 2)
              return false;
          let allow = ["2m", "3m", "4m", "5m", "6m", "7m", "8m", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "2s", "3s", "4s", "5s", "6s", "7s", "8s"];
          return checkAllowed(o, allow);
        } },
        "\u5E73\u548C": { "han": 1, "isMenzenOnly": true, "check": (o) => {
          let hasAgariFu = true;
          for (let v of o.currentPattern) {
            if (typeof v === "string") {
              if (v.includes("z") && [o.bakaze, o.jikaze, 5, 6, 7].includes(parseInt(v)))
                return false;
            } else if (v.length !== 3 || v[0] === v[1]) {
              return false;
            } else if (v[0] === o.agari && parseInt(v[2]) !== 9 || v[2] === o.agari && parseInt(v[0]) !== 1) {
              hasAgariFu = false;
            }
          }
          return !hasAgariFu;
        } },
        "\u4E00\u76C3\u53E3": { "han": 1, "isMenzenOnly": true, "check": (o) => {
          if (YAKU2["\u4E8C\u76C3\u53E3"].check(o))
            return false;
          for (let i in o.currentPattern) {
            i = parseInt(i);
            let v = o.currentPattern[i];
            if (v.length === 3 && v[0] != v[1]) {
              while (i < 4) {
                i++;
                try {
                  assert.deepStrictEqual(v, o.currentPattern[i]);
                  return true;
                } catch (e) {
                }
              }
            }
          }
          return false;
        } },
        "\u9580\u524D\u6E05\u81EA\u6478\u548C": { "han": 1, "isMenzenOnly": true, "check": (o) => {
          return o.isTsumo;
        } },
        "\u7ACB\u76F4": { "han": 1, "isMenzenOnly": true, "check": (o) => {
          return (YAKU2["\u4E00\u767A"].check(o) || (o.extra.includes("r") || o.extra.includes("l"))) && !YAKU2["\u30C0\u30D6\u30EB\u7ACB\u76F4"].check(o);
        } },
        "\u4E00\u767A": { "han": 1, "isMenzenOnly": true, "check": (o) => {
          return o.extra.includes("i") || o.extra.includes("y");
        } },
        "\u5DBA\u4E0A\u958B\u82B1": { "han": 1, "check": (o) => {
          let hasKantsu = false;
          for (let v of o.furo) {
            if (v.length === 2 || v.length === 4) {
              hasKantsu = true;
              break;
            }
          }
          return hasKantsu && o.extra.includes("k") && !o.extra.includes("h") && o.isTsumo && !YAKU2["\u4E00\u767A"].check(o);
        } },
        "\u6436\u69D3": { "han": 1, "check": (o) => {
          return o.extra.includes("k") && !o.extra.includes("h") && !o.isTsumo;
        } },
        "\u6D77\u5E95\u6478\u6708": { "han": 1, "check": (o) => {
          return o.extra.includes("h") && o.isTsumo;
        } },
        "\u6CB3\u5E95\u6488\u9B5A": { "han": 1, "check": (o) => {
          return o.extra.includes("h") && !o.isTsumo && !YAKU2["\u4E00\u767A"].check(o);
        } },
        "\u5834\u98A8\u6771": { "han": 1, "check": (o) => {
          return o.bakaze === 1 && checkYakuhai(o, 1);
        } },
        "\u5834\u98A8\u5357": { "han": 1, "check": (o) => {
          return o.bakaze === 2 && checkYakuhai(o, 2);
        } },
        "\u5834\u98A8\u897F": { "han": 1, "check": (o) => {
          return o.bakaze === 3 && checkYakuhai(o, 3);
        } },
        "\u5834\u98A8\u5317": { "han": 1, "check": (o) => {
          return o.bakaze === 4 && checkYakuhai(o, 4);
        } },
        "\u81EA\u98A8\u6771": { "han": 1, "check": (o) => {
          return o.jikaze === 1 && checkYakuhai(o, 1);
        } },
        "\u81EA\u98A8\u5357": { "han": 1, "check": (o) => {
          return o.jikaze === 2 && checkYakuhai(o, 2);
        } },
        "\u81EA\u98A8\u897F": { "han": 1, "check": (o) => {
          return o.jikaze === 3 && checkYakuhai(o, 3);
        } },
        "\u81EA\u98A8\u5317": { "han": 1, "check": (o) => {
          return o.jikaze === 4 && checkYakuhai(o, 4);
        } },
        "\u5F79\u724C\u767D": { "han": 1, "check": (o) => {
          return checkYakuhai(o, 5);
        } },
        "\u5F79\u724C\u767A": { "han": 1, "check": (o) => {
          return checkYakuhai(o, 6);
        } },
        "\u5F79\u724C\u4E2D": { "han": 1, "check": (o) => {
          return checkYakuhai(o, 7);
        } }
      };
      module2.exports = YAKU2;
    }
  });

  // node_modules/riichi/index.js
  var require_riichi = __commonJS({
    "node_modules/riichi/index.js"(exports, module) {
      "use strict";
      var agari = require_agari();
      var syanten = require_syanten();
      var YAKU = require_yaku();
      var MPSZ = ["m", "p", "s", "z"];
      var KAZE = [void 0, "\u6771", "\u5357", "\u897F", "\u5317", "\u767D", "\u767C", "\u4E2D"];
      var ceil10 = (num) => {
        return Math.ceil(num / 10) * 10;
      };
      var ceil100 = (num) => {
        return Math.ceil(num / 100) * 100;
      };
      var isHai = (text) => {
        return typeof text === "string" && text.length === 2 && !isNaN(text[0]) && MPSZ.includes(text[1]);
      };
      var is19 = (text) => {
        return isHai(text) && (text.includes("1") || text.includes("9") || text.includes("z"));
      };
      var isFuro = (arr) => {
        if (arr instanceof Array !== true || arr.length > 4 || arr.length < 2)
          return false;
        let set = new Set(arr);
        if (set.size === 1)
          return isHai(arr[0]);
        else {
          if (set.size !== 3)
            return false;
          let minus1 = parseInt(arr[1]) - parseInt(arr[0]);
          let minus2 = parseInt(arr[2]) - parseInt(arr[1]);
          if (minus1 !== minus2 || minus1 !== 1)
            return false;
        }
        return true;
      };
      var parse = (text) => {
        let tmp = [];
        let aka = 0;
        for (let v of text) {
          if (!isNaN(v)) {
            if (v === "0")
              v = "5", aka++;
            tmp.push(v);
          }
          if (MPSZ.includes(v)) {
            for (let k in tmp)
              if (!isNaN(tmp[k]))
                tmp[k] += v;
          }
        }
        let res = [];
        for (let v of tmp)
          if (isNaN(v))
            res.push(v);
        return { "res": tmp, "aka": aka };
      };
      var Riichi = class {
        /**
         * @param string data
         */
        constructor(data) {
          this.hai = [];
          this.haiArray = [
            // 複合array型手牌(和了牌含)
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
          ];
          this.furo = [];
          this.agari = "";
          this.dora = [];
          this.extra = "";
          this.isTsumo = true;
          this.isOya = false;
          this.bakaze = 1;
          this.jikaze = 2;
          this.aka = 0;
          this.agariPatterns = [];
          this.currentPattern;
          this.tmpResult = {
            //臨時計算結果
            "isAgari": false,
            //和了?
            "yakuman": 0,
            //役満倍数
            "yaku": {},
            //手役 例:{'天和':'役満','大四喜':'ダブル役満'} 例:{'立直':'1飜','清一色':'6飜'}
            "han": 0,
            //飜数
            "fu": 0,
            //符数
            "ten": 0,
            //点数(this.isOya=undefined場合，計算不能)
            "name": "",
            //例:'満貫'、'跳満'、'倍満'、'三倍満'、'数え役満'
            "text": "",
            //結果text 例:'30符4飜'、'40符4飜 満貫'、'6倍役満'
            "oya": [0, 0, 0],
            //親家得点 例:[2600,2600,2600]、[7700]
            "ko": [0, 0, 0],
            //子家得点 例:[3900,2000,2000]、[7700]
            "error": true
            //input error
          };
          this.finalResult;
          this.allLocalEnabled = false;
          this.localEnabled = [];
          this.disabled = [];
          this.allowWyakuman = true;
          this.allowKuitan = true;
          this.allowAka = true;
          this.hairi = true;
          if (typeof data !== "string")
            return;
          data = data.toLowerCase();
          let arr = data.split("+");
          let hai = arr.shift();
          for (let v of arr) {
            if (!v.includes("m") && !v.includes("p") && !v.includes("s") && !v.includes("z"))
              this.extra = v;
            else if (v[0] === "d")
              this.dora = parse(v.substr(1)).res;
            else if (isHai(v)) {
              hai += v;
              this.isTsumo = false;
            } else {
              let tmp2 = [];
              for (let vv of v) {
                if (MPSZ.includes(vv)) {
                  for (let k in tmp2)
                    tmp2[k] += vv;
                  if (isFuro(tmp2))
                    this.furo.push(tmp2.sort());
                  tmp2 = [];
                } else {
                  if (vv === "0")
                    vv = "5", this.aka++;
                  tmp2.push(vv);
                }
              }
            }
          }
          let tmp = parse(hai);
          this.hai = tmp.res;
          this.aka += tmp.aka;
          this.agari = this.hai.slice(-1)[0];
          if (this.hai.length % 3 === 0)
            return;
          if (this.hai.length + this.furo.length * 3 > 14)
            return;
          for (let v of this.hai) {
            let n = parseInt(v);
            let i = MPSZ.indexOf(v.replace(n, ""));
            this.haiArray[i][n - 1]++;
          }
          let kaze = this.extra.replace(/[a-z]/g, "");
          if (kaze.length === 1)
            this.jikaze = parseInt(kaze);
          if (kaze.length > 1) {
            this.bakaze = parseInt(kaze[0]);
            this.jikaze = parseInt(kaze[1]);
          }
          if (this.jikaze === 1)
            this.isOya = true;
          else
            this.isOya = false;
          this.tmpResult.error = false;
          this.finalResult = JSON.parse(JSON.stringify(this.tmpResult));
        }
        /**
         * 門前判定
         */
        isMenzen() {
          for (let v of this.furo)
            if (v.length > 2)
              return false;
          return true;
        }
        /**
         * dora枚数計算
         */
        calcDora() {
          if (!this.tmpResult.han)
            return;
          let dora = 0;
          for (let v of this.hai) {
            for (let vv of this.dora) {
              if (v === vv)
                dora++;
            }
          }
          for (let v of this.furo) {
            if (v.length === 2)
              v = v.concat(v);
            for (let vv of v) {
              for (let vvv of this.dora) {
                if (vvv === vv)
                  dora++;
              }
            }
          }
          if (dora) {
            this.tmpResult.han += dora;
            this.tmpResult.yaku["\u30C9\u30E9"] = dora + "\u98DC";
          }
          if (this.allowAka && this.aka) {
            this.tmpResult.han += this.aka;
            this.tmpResult.yaku["\u8D64\u30C9\u30E9"] = this.aka + "\u98DC";
          }
        }
        /**
         * 符計算
         */
        calcFu() {
          let fu = 0;
          if (this.tmpResult.yaku["\u4E03\u5BFE\u5B50"]) {
            fu = 25;
          } else if (this.tmpResult.yaku["\u5E73\u548C"]) {
            fu = this.isTsumo ? 20 : 30;
          } else {
            fu = 20;
            let hasAgariFu = false;
            if (!this.isTsumo && this.isMenzen())
              fu += 10;
            for (let v of this.currentPattern) {
              if (typeof v === "string") {
                if (v.includes("z")) {
                  for (let vv of [this.bakaze, this.jikaze, 5, 6, 7])
                    if (parseInt(v) === vv)
                      fu += 2;
                }
                if (this.agari === v)
                  hasAgariFu = true;
              } else {
                if (v.length === 4)
                  fu += is19(v[0]) ? 16 : 8;
                else if (v.length === 2)
                  fu += is19(v[0]) ? 32 : 16;
                else if (v.length === 1)
                  fu += is19(v[0]) ? 8 : 4;
                else if (v.length === 3 && v[0] === v[1])
                  fu += is19(v[0]) ? 4 : 2;
                else if (!hasAgariFu) {
                  if (v[1] === this.agari)
                    hasAgariFu = true;
                  else if (v[0] === hasAgariFu && parseInt(v[2]) === 9)
                    hasAgariFu = true;
                  else if (v[2] === hasAgariFu && parseInt(v[0]) === 1)
                    hasAgariFu = true;
                }
              }
            }
            if (hasAgariFu)
              fu += 2;
            if (this.isTsumo)
              fu += 2;
            fu = ceil10(fu);
            if (fu < 30)
              fu = 30;
          }
          this.tmpResult.fu = fu;
        }
        /**
         * 点数計算
         */
        calcTen() {
          this.tmpResult.name = "";
          let base;
          this.tmpResult.text = `(${KAZE[this.bakaze]}\u5834`;
          this.tmpResult.text += KAZE[this.jikaze] + "\u5BB6)";
          this.tmpResult.text += this.isTsumo ? "\u81EA\u6478" : "\u6804\u548C";
          if (this.tmpResult.yakuman) {
            base = 8e3 * this.tmpResult.yakuman;
            this.tmpResult.name = this.tmpResult.yakuman > 1 ? this.tmpResult.yakuman + "\u500D\u5F79\u6E80" : "\u5F79\u6E80";
          } else {
            if (!this.tmpResult.han)
              return;
            base = this.tmpResult.fu * Math.pow(2, this.tmpResult.han + 2);
            this.tmpResult.text += " " + this.tmpResult.fu + "\u7B26" + this.tmpResult.han + "\u98DC";
            if (base > 2e3) {
              if (this.tmpResult.han >= 13) {
                base = 8e3;
                this.tmpResult.name = "\u6570\u3048\u5F79\u6E80";
              } else if (this.tmpResult.han >= 11) {
                base = 6e3;
                this.tmpResult.name = "\u4E09\u500D\u6E80";
              } else if (this.tmpResult.han >= 8) {
                base = 4e3;
                this.tmpResult.name = "\u500D\u6E80";
              } else if (this.tmpResult.han >= 6) {
                base = 3e3;
                this.tmpResult.name = "\u8DF3\u6E80";
              } else {
                base = 2e3;
                this.tmpResult.name = "\u6E80\u8CAB";
              }
            }
          }
          this.tmpResult.text += (this.tmpResult.name ? " " : "") + this.tmpResult.name;
          if (this.isTsumo) {
            this.tmpResult.oya = [ceil100(base * 2), ceil100(base * 2), ceil100(base * 2)];
            this.tmpResult.ko = [ceil100(base * 2), ceil100(base), ceil100(base)];
          } else {
            this.tmpResult.oya = [ceil100(base * 6)];
            this.tmpResult.ko = [ceil100(base * 4)];
          }
          this.tmpResult.ten = this.isOya ? eval(this.tmpResult.oya.join("+")) : eval(this.tmpResult.ko.join("+"));
          this.tmpResult.text += " " + this.tmpResult.ten + "\u70B9";
          if (this.isTsumo) {
            this.tmpResult.text += "(";
            if (this.isOya)
              this.tmpResult.text += this.tmpResult.oya[0] + "all";
            else
              this.tmpResult.text += this.tmpResult.ko[0] + "," + this.tmpResult.ko[1];
            this.tmpResult.text += ")";
          }
        }
        /**
         * 手役計算
         */
        calcYaku() {
          this.tmpResult.yaku = {};
          this.tmpResult.yakuman = 0;
          this.tmpResult.han = 0;
          for (let k in YAKU) {
            let v = YAKU[k];
            if (this.disabled.includes(k))
              continue;
            if (v.isLocal && !this.allLocalEnabled && !this.localEnabled.includes(k))
              continue;
            if (this.tmpResult.yakuman && !v.yakuman)
              continue;
            if (v.isMenzenOnly && !this.isMenzen())
              continue;
            if (v.check(this)) {
              if (v.yakuman) {
                let n = this.allowWyakuman ? v.yakuman : 1;
                this.tmpResult.yakuman += n;
                this.tmpResult.yaku[k] = n > 1 ? "\u30C0\u30D6\u30EB\u5F79\u6E80" : "\u5F79\u6E80";
              } else {
                let n = v.han;
                if (v.isFuroMinus && !this.isMenzen())
                  n--;
                this.tmpResult.yaku[k] = n + "\u98DC";
                this.tmpResult.han += n;
              }
            }
          }
        }
        // api exports ↓ ----------------------------------------------------------------------------------------------------
        disableWyakuman() {
          this.allowWyakuman = false;
        }
        disableKuitan() {
          this.allowKuitan = false;
        }
        disableAka() {
          this.allowAka = false;
        }
        enableLocalYaku(name) {
          this.localEnabled.push(name);
        }
        disableYaku(name) {
          this.disabled.push(name);
        }
        // supported local yaku list
        // 大七星 役満(字一色別)
        // 人和 役満
        // 
        disableHairi() {
          this.hairi = false;
        }
        /**
         * main
         */
        calc() {
          if (this.tmpResult.error) {
            return this.tmpResult;
          }
          this.tmpResult.isAgari = agari.checkAll(this.haiArray);
          if (!this.tmpResult.isAgari || this.hai.length + this.furo.length * 3 !== 14) {
            if (this.hairi) {
              this.tmpResult.hairi = syanten.hairi(this.haiArray);
              this.tmpResult.hairi7and13 = syanten.hairi(this.haiArray, true);
            }
            return this.tmpResult;
          }
          this.finalResult.isAgari = true;
          if (this.extra.includes("o"))
            this.allLocalEnabled = true;
          this.agariPatterns = agari(this.haiArray);
          if (!this.agariPatterns.length)
            this.agariPatterns.push([]);
          for (let v of this.agariPatterns) {
            if (!this.isTsumo) {
              for (let k in v) {
                let vv = v[k];
                if (vv.length === 1 && vv[0] === this.agari) {
                  let i = MPSZ.indexOf(this.agari[1]);
                  if (this.haiArray[i][parseInt(this.agari) - 1] < 4)
                    v[k] = [vv[0], vv[0], vv[0]];
                }
              }
            }
            this.currentPattern = v.concat(this.furo);
            this.calcYaku();
            if (!this.tmpResult.yakuman && !this.tmpResult.han)
              continue;
            if (this.tmpResult.han) {
              this.calcDora();
              this.calcFu();
            }
            this.calcTen();
            if (this.tmpResult.ten > this.finalResult.ten)
              this.finalResult = JSON.parse(JSON.stringify(this.tmpResult));
            else if (this.tmpResult.ten === this.finalResult.ten && this.tmpResult.han > this.finalResult.han)
              this.finalResult = JSON.parse(JSON.stringify(this.tmpResult));
          }
          if (!this.finalResult.ten)
            this.finalResult.text = "\u7121\u5F79";
          return this.finalResult;
        }
      };
      module.exports = Riichi;
    }
  });

  // riichi-entry.js
  var require_riichi_entry = __commonJS({
    "riichi-entry.js"() {
      var Riichi2 = require_riichi();
      var syanten2 = require_syanten();
      window.RiichiCalc = Riichi2;
      window.SyantenCalc = syanten2;
    }
  });
  require_riichi_entry();
})();
