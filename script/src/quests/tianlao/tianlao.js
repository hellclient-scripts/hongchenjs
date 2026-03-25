$.Module(function (App) {
    let Tianlao = {}
    Tianlao.Data = {
        Success: 0,
        Gifts: {},
        Finished: false,
        Start: 0,
        Cost: 0,
        Box: 0,
        GoodBox: 0,
        Migong: [],
    }
    let matcherYanfei = "看起来燕非想杀死你！"
    let matcherGift = /^你从打开的宝箱中拿出一.(.+)。/
    let matcherBox = "你把宝箱打开了。"
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherBox, (tri, result) => {
                Tianlao.Data.Box++
                return true
            })
            task.AddTrigger(matcherYanfei, (tri, result) => {
                App.Send("kill yan fei")
                if (App.Combat) {
                    App.Combat.Target = "yan fei"
                }
                return true
            })
            //统计奖品
            task.AddTrigger(matcherGift, (tri, result) => {
                let gift = result[1]
                if (!Tianlao.Data.Gifts[gift]) {
                    Tianlao.Data.Gifts[gift] = 0
                }
                Tianlao.Data.GoodBox++
                Tianlao.Data.Gifts[gift]++
                return true
            })
            //副本失败
            task.AddCatcher("core.fubenfail", (catcher, event) => {
                if (Tianlao.Data.Finished) {
                    event.Context.Set("callback", () => {
                        Note("离开副本")
                    })
                }
                Quest.Cooldown(120000)
                return true
            })
        })
    Tianlao.Start = () => {
        Tianlao.Data.Finished = false
        PlanQuest.Execute()
        Tianlao.Enter()
    }
    Tianlao.Enter = () => {
        $.PushCommands(
            $.Prepare("commonWithExp"),
            $.Timeslice("天牢"),
            $.To("fuben-tianlao"),
            $.Plan(PlanEnter)
        )
        $.Next()
    }
    let PlanEnter = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.AddTrigger("祝你好运气！", (catcher, result) => {
                //成功进入副本
                task.Data = "ok"
                return true
            })
            App.Send("unride;enter door")
            App.Sync()

        },
        (result) => {
            if (result.Task.Data == "ok") {
                Tianlao.Entered()
                return
            }
            Note("进入失败")
            App.Core.Timeslice.Change("")
            Quest.Cooldown(120000)
            App.Fail()
        }
    )
    let matcherAnswerYes = /^太监有气无力地说道：这位.+，你是来为皇宫清除叛逆的吗？？\(answer yes\/no\)$/
    let matcherAcceptYes = "太监说道：你愿意为宫廷清理叛逆，铲除李莲英吗？(accept yes/no)"
    let PlanAccept = new App.Plan(
        App.Positions["Room"],
        (task) => {
            task.AddTrigger(matcherAnswerYes, (tri, result) => {
                App.Send("answer yes")
                return true
            })
            task.AddTrigger(matcherAcceptYes, (tri, result) => {
                App.Send("accept yes")
            })
            $.RaiseStage("wait")
        },
        (result) => {
            App.Send("halt")
            App.Next()
        })
    Tianlao.Entered = () => {
        Tianlao.Data.Start = $.Now()
        Note("进入副本，打探地图")
        Quest.Cooldown(120000)
        App.Core.Fuben.Last = $.Now()
        $.PushCommands(
            $.Plan(PlanAccept),
            $.Path(["s"]),
            $.Function(App.Core.Fuben.LoadMazeMap),//加载地图
            $.Function(Tianlao.Maze)
        )
        $.Next()
    }
    Tianlao.Maze = () => {
        App.Map.Room.ID = $.RID("fuben-tianlao-entry")
        if (App.Core.Fuben.Current == null) {
            Quest.Cooldown(120000)
            $.PushCommands(
                $.To("gc"),
            )
            $.Next()
            return
        }
        Tianlao.AddApth()
        $.PushCommands(
            $.Function(() => {
                $.RaiseStage("prepare")
                $.Next()
            }),
            $.To(["fuben-tianlao-exit"], App.Map.SingleStep()),
            $.CounterAttack("lao tou", App.NewCombat("tianlao").WithTags("牢头")),
            $.Do("get gold from corpse;get silver from corpse 2;i"),
            $.Sync(),
            $.Function(() => {
                App.Look()
                $.Next()
            }),
            $.Sync(),
            $.Function(() => {
                if (App.Map.Room.Data.Objects.FindByID("maze door").First() == null) {
                    App.Next()
                    return
                }
                App.PushCommands(
                    $.Path(["enter door"]),
                    $.Function(Tianlao.Migong),
                )
                App.Next()
            })
        )
        $.Next()
    }
    Tianlao.Migong = () => {
        $.PushCommands(
            $.Function(App.Core.Fuben.LoadMazeMap),
            $.Function(() => {
                if (!App.Core.Fuben.Current || !App.Core.Fuben.Current.Landmark["entry"] || !App.Core.Fuben.Current.Landmark["exit"] || !App.Core.Fuben.Current.Landmark["current"]) {
                    App.Log("副本迷宫地图错误")
                    App.Fail()
                    return
                }
                Tianlao.Data.Migong = [...App.Core.Fuben.Current.Rooms].filter(v => v != App.Core.Fuben.Current.Landmark["exit"] && v != App.Core.Fuben.Current.Landmark["current"])
                App.Map.Room.ID = App.Core.Fuben.Current.Landmark["current"]
                $.Next()
            }),
            $.Function(() => {
                $.Insert(
                    $.Rooms(Tianlao.Data.Migong, App.Map.SingleStep(), Tianlao.Checker),
                )
                $.Next()
            }),
            $.Function(() => {
                Note("搜刮结束，离开")
                $.Insert($.To(App.Core.Fuben.Current.Landmark["exit"], App.Map.SingleStep(), Tianlao.Checker))
                $.Next()
            }),
            $.Function(Tianlao.Leave)
        )
        $.Next()
    }
    Tianlao.Retry = () => {
        App.Commands.Drop()
        $.PushCommands(
            $.Function(App.Core.Fuben.LoadMazeMap),
            $.Function(() => {
                if (!App.Core.Fuben.Current || !App.Core.Fuben.Current.Landmark["entry"] || !App.Core.Fuben.Current.Landmark["exit"] && !App.Core.Fuben.Current.Landmark["current"]) {
                    App.Log("副本迷宫地图错误")
                    App.Fail()
                    return
                }
                App.Map.Room.ID = App.Core.Fuben.Current.Landmark["current"]
                $.Next()
            }),
            $.Function(() => {
                $.Insert(
                    $.Rooms(Tianlao.Data.Migong, App.Map.SingleStep(), Tianlao.Checker),
                )
                $.Next()
            }),
            $.Function(() => {
                Note("搜刮结束，离开")
                $.Insert($.To(App.Core.Fuben.Current.Landmark["exit"], App.Map.SingleStep(), Tianlao.Checker))
                $.Next()
            }),
            $.Function(Tianlao.Leave)
        )
        $.Next()
    }
    Tianlao.Leave = () => {
        if (App.Map.Room.Exits.indexOf("out") >= 0) {
            App.PushCommands(
                $.Do("i"),
                $.Path(["out"]),
                $.Function(() => {
                    App.Map.Room.ID = $.RID("wm")
                    Quest.Cooldown(120000)
                    Tianlao.Data.Success++
                    Tianlao.Data.Cost += $.Now() - Tianlao.Data.Start
                    App.Next()
                }),
                $.Timeslice(""),
                $.Prepare("commonWithExp"),
            )
            App.Next()
            return true
        }
        App.Fail()
    }
    let matcherInjured = "你脚下一滑，差点摔个嘴啃泥，好不容易稳住身子，才感觉脚踝扭伤了，好痛啊..."
    let matcherInjured2 = "只听得一声机括脆响，你下意识的赶紧避让，却为时已晚，一支钢弩不偏不倚正好射中你。"
    let matcherInjured3 = "你一脚踩上了什么东西，身形再也把持不住，猛的向前滑出，只留下一声惊叫久久回荡..."
    let matcherRetry = "你一脚踩到了什么东西，急惶惶的把脚收起，却已经听到阵阵沉闷的声音从地下响起..."
    let matcherRetry2 = "只见四周光影晃动，整个房间似乎在快速移动，等一切安静下来，周遭景象似乎有所改变。"

    let PlanCheck = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.Data = ""
            task.AddTrigger(matcherInjured, (tri, result) => {
                task.Data = "injured"
                return true
            })
            task.AddTrigger(matcherInjured2, (tri, result) => {
                task.Data = "injured"
                return true
            })
            task.AddTrigger(matcherInjured3, (tri, result) => {
                task.Data = "injured"
                return true
            })
            task.AddTrigger(matcherRetry, (tri, result) => {
                task.Data = "injuretryred"
                return true
            })
            task.AddTrigger(matcherRetry2, (tri, result) => {
                task.Data = "retry"
                return true
            })
            App.Sync()
        },
        (result) => {
            if (result.Task.Data == "retry") {
                Tianlao.Retry()
                return
            }
            if (result.Task.Data == "injured") {
                $.Insert($.Do("hp"), $.Sync(), $.Rest())
            }
            App.Next()
        })
    Tianlao.Checker = function (move, map) {
        move.OnArrive = function (move, map) {
            if (App.Map.Room.ID) {
                Tianlao.Data.Migong = Tianlao.Data.Migong.filter(v => v != App.Map.Room.ID)
            }
            let snap = App.Map.Snap()
            App.Commands.Insert(
                $.Plan(PlanCheck),
                $.Function(() => {
                    if (App.Map.Room.Data.Objects.FindByLabel("宝箱").First()) {
                        App.Send("open bao xiang;get all from bao xiang")
                    }
                    $.Next()
                }),
                App.Commands.NewFunctionCommand(() => {
                    App.Map.Rollback(snap)
                    move.Walk(map)
                })
            )
            $.Next()
        }
    }
    //补全迷宫地图连接
    Tianlao.AddApth = () => {
        let entry = $.RID("fuben-tianlao-entry")
        let exit = $.RID("fuben-tianlao-exit")
        App.Core.Fuben.Current.AddPath(entry, App.Core.Fuben.Current.Landmark["entry"], "s")
        App.Core.Fuben.Current.AddPath(App.Core.Fuben.Current.Landmark["entry"], entry, "n")
        App.Core.Fuben.Current.AddPath(exit, App.Core.Fuben.Current.Landmark["exit"], "n")
        App.Core.Fuben.Current.AddPath(App.Core.Fuben.Current.Landmark["exit"], exit, "s")
    }

    let Quest = App.Quests.NewQuest("tianlao")
    Quest.Name = "天牢副本"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "tianlao"
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("天牢:"),
            new App.HUD.UI.Word(App.HUD.UI.ShortNumber(Tianlao.Data.Success), 5, true),
        ]

    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("牢:"),
            new App.HUD.UI.Word(App.HUD.UI.ShortNumber(Tianlao.Data.Success), 5, true),
        ]

    }
    Quest.OnReport = () => {
        let gift = []
        let giftdata = []
        for (var name in Tianlao.Data.Gifts) {
            let rate = (Tianlao.Data.Gifts[name] * 100 / Tianlao.Data.Box).toFixed(2) + "%"
            giftdata.push({ label: `${name}:${Tianlao.Data.Gifts[name]}件 (${rate})`, sum: Tianlao.Data.Gifts[name] })
        }
        if (giftdata.length > 0) {
            giftdata.sort((a, b) => {
                return b.sum - a.sum
            })
            gift = giftdata.map(v => v.label)
        }
        let cost = Tianlao.Data.Success > 0 ? (Tianlao.Data.Cost / Tianlao.Data.Success / 1000).toFixed() + "秒" : "-"
        let d = $.Now() - App.Quests.StartAt
        let eff = d > 0 ? (Tianlao.Data.Success * 3600 * 1000 / d).toFixed(0) + "次/小时" : "-"
        let box = Tianlao.Data.Success > 0 ? (Tianlao.Data.Box / Tianlao.Data.Success).toFixed(2) + "个" : "-"
        let rate = Tianlao.Data.Box > 0 ? (Tianlao.Data.GoodBox * 100 / Tianlao.Data.Box).toFixed(2) + "%" : "-"
        return [`天牢-成功:${Tianlao.Data.Success}次 宝箱:${Tianlao.Data.Box} 出货:${Tianlao.Data.GoodBox} 毛效率:${eff} 平均耗时：${cost} 平均宝箱:${box} 出货率:${rate}`, `天牢-奖励： ${gift.join(" , ")}`]
    }
    Quest.Start = function (data) {
        Tianlao.Start()
    }
    App.Core.Quest.AppendInitor((e) => {
        Tianlao.Data = {
            Success: 0,
            Gifts: {},
            Finished: false,
            Start: 0,
            Cost: 0,
            Box: 0,
            GoodBox: 0,
            Migong: [],
        }
    })

    App.Quests.Register(Quest)
    App.Quests.Tianlao = Tianlao
})