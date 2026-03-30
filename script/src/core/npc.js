//npc信息模块
(function (App) {
    App.Core.NPC = {}
    App.Core.NPC["姓"] = {};
    App.Core.NPC.AskYouxunData = {
        Name: "",
        Live: false,
    }
    //加载姓信息
    App.LoadLines("data/name2.txt", "|").forEach((data) => {
        App.Core.NPC["姓"][data[0]] = data[1]
    })
    App.Core.NPC["名"] = {};
    //加载名信息
    App.LoadLines("data/name.txt", "|").forEach((data) => {
        data[1].split("").forEach((char) => {
            if (App.Core.NPC["名"][char] == null) {
                App.Core.NPC["名"][char] = []
            }
            App.Core.NPC["名"][char].push(data[0])
        })
    })
    //获取npc名拼音(ask youxun用)
    App.Core.NPC.GetPinyin = function (name) {
        let firstname = ""
        let resultlastname = []
        if (name.length < 2) {
            return []
        }
        if (App.Core.NPC["姓"][name.slice(0, 2)]) {
            firstname = App.Core.NPC["姓"][name.slice(0, 2)]
            name = name.slice(2)
        } else if (App.Core.NPC["姓"][name.slice(0, 1)]) {
            firstname = App.Core.NPC["姓"][name.slice(0, 1)]
            name = name.slice(1)
        } else {
            App.Log("无法识别的姓氏 " + name)
            return []
        }
        let 名 = name.split("")
        for (var char of 名) {
            if (App.Core.NPC["名"][char]) {
                resultlastname.push(App.Core.NPC["名"][char])
            } else {
                App.Log("无法识别的名字 " + char + " in " + name)
                return []
            }
        }
        var last = []
        var output = [firstname + " "]
        resultlastname.forEach((chars) => {
            last = output
            output = []
            chars.forEach((char) => {
                last.forEach((pre) => {
                    output.push(pre + char)
                })
            })
        })
        return output
    }
    //检查npc是否还活着
    App.Core.NPC.AskBeichouAnswer = {
        "北丑嘿嘿奸笑两声，对你小声道：没有问题，不过得要一两黄金，不二价！": true,
        "北丑皱了皱眉头，对你摇摇头道：看来你这次确实是遇到了困难，收你十两白银就是了。": true
    }
    App.Core.NPC.CheckBeichou = function (name, id) {
        App.Core.NPC.AskBeichouData = {
            Name: name,
            ID: "",
            IDList: id ? [id] : App.Core.NPC.GetPinyin(name),
            Live: false,
            Silver: false,
        }
        App.Core.NPC.CheckBeichouNext()
    }
    App.Core.NPC.CheckBeichouNext = function () {
        if (App.Core.NPC.AskBeichouData["IDList"].length) {
            App.Core.NPC.AskBeichouData.ID = App.Core.NPC.AskBeichouData["IDList"].shift()
            App.Commands.PushCommands(
                App.Move.NewToCommand("bei chou"),
                App.NewAskCommand("bei chou", App.Core.NPC.AskBeichouData.ID, 1),
                App.Commands.NewFunctionCommand(() => {
                    if (App.Data.Ask.Answers.length && App.Core.NPC.AskBeichouAnswer[App.Data.Ask.Answers[0].Line]) {
                        App.Core.NPC.AskBeichouData.Live = true
                        if (App.Data.Ask.Answers[0].Line.includes("白银")) {
                            App.Core.NPC.AskBeichouData.Silver = true
                        }
                    } else {
                        App.Insert(App.Commands.NewFunctionCommand(App.Core.NPC.CheckBeichouNext))
                    }
                    App.Next()
                })
            ).WithFailCommand(
                App.Commands.NewFunctionCommand(() => {
                    App.Next()
                })
            )
        }
        App.Next()
    }
    //门派信息
    App.Core.NPC.Family = {}
    //加载门派设定
    // App.LoadLines("data/family.txt", "|").forEach((data) => {
    //     App.Core.NPC.Family[data[0]] = {
    //         Name: data[0],
    //         LocMaster: data[1],
    //         MasterID: data[2],
    //         LocSleep: data[3],
    //         LocDazuo: data[4],
    //         IDPass: data[5],
    //     }
    // })
    App.Core.NPC.Load = function () {
        App.Core.Player.FamilyList.forEach(data => {
            App.Core.NPC.Family[data[1]] = {
                IDPass: data[0]
            }
        })
        let fam = App.Core.NPC.Family[App.Data.Player.Score["门派"]]
        if (fam) {
            Note("引入门派设置")
            if (App.Mapper.Data.NPCMap[App.Data.Player.Score["掌门"]]) {
                App.Params.MasterID = App.Mapper.Data.NPCMap[App.Data.Player.Score["掌门"]].ID
                App.Params.LocMaster = App.Data.Player.Score["掌门"]
            } else {
                Note(`无法找到掌门 ${App.Data.Player.Score["掌门"]} 的信息`)
            }
            App.Params.IDPass = fam.IDPass
        }
        let idpass = GetVariable("id_pass").trim()
        if (idpass) {
            App.Params.IDPass = idpass
        }
        if (App.Params.IDPass) {
            Note("门派标签为 " + App.Params.IDPass)
        }
        if (GetVariable("house").trim()) {
            App.Params.LocDazuo = "dazuo"
            App.Params.LocSleep = "sleep"
        }
    }
    //根据门派调整移动信息
    App.Map.AppendInitiator((map) => {
        if (App.Params.IDPass) {
            App.Params.IDPass.split(",").forEach(val => {
                map.SetTag(val.trim(), 1)
            })

        }
    })
    App.Core.NPC.Kungfu = {}
    //加载npc师傅列表
    // App.LoadLines("data/kungfunpc.txt", "|").forEach((data) => {
    //     App.Core.NPC.Kungfu[data[0]] = {
    //         Key: data[0],
    //         Name: data[1],
    //         Loc: data[2],
    //         ID: data[3],
    //     }
    // })
    App.Mapper.Database.APIListMarkers(App.Mapper.HMM.APIListOption.New().WithGroups(["npc"])).forEach((model) => {
        let data = model.Message.split("|")
        App.Core.NPC.Kungfu[model.Key] = {
            Key: model.Key,
            Name: [data[0]],
            ID: [data[1]],
        }
    })
    App.Core.NPC.Other = {}
    App.LoadLines("data/othernpc.txt", "|").forEach((data) => {
        App.Core.NPC.Other[data[0]] = {
            Name: data[0],
            ID: data[1],
            Loc: data[2].split(",")
        }
    })
    App.Mapper.Data.NPCList.forEach((npc) => {
        App.Core.NPC.Other[npc.Name] = {
            Name: npc.Name,
            ID: npc.ID,
            Loc: [npc.Value],
        }
    })
})(App)