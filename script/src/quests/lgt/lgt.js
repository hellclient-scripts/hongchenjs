//爬灵感塔模块
$.Module(function (App) {
    let relgtfloor = /^灵感.*塔\.第(.*)层$/
    let matcherNext = /^杨小邪\(yang xiaoxie\)偷偷告诉你：据说上面关押的是：(.*)，/
    let matcherWuchi = /^(看起来武痴想杀死你！|武痴左手两指|武痴双手虚虚实实|武痴轻轻地往上方一飘|武痴凝神闭息|武痴扬手|武痴身形忽然变得诡秘异常|武痴身子忽进忽退|武痴深深吸进一口气|武痴随手抓出)/
    let matcherLeft = /^\(你还有(\d+)张灵符\)$/
    let LGT = {}
    //最后依次爬塔爬了多少层
    LGT.LastLevel = 0
    //最后一次爬塔的时间
    LGT.Last = 0
    LGT.Data = {
        Level: 0,
        Entered: false,
        灵符: 0,
        Gifts: {},
        Tihui: 0,
        Count: 0,
        Current: "",
        LastTihui: 0,
        Ready: 0,//0需要等待,1可以Check
        Entry: [],
    }
    //遇到武痴后重连的代码
    LGT.Connect = () => {
        App.Commands.Drop()
        PlanQuest.Execute()
        $.PushCommands(
            $.Function(LGT.Kill),
        )
        $.Next()
    }
    //你在灵感西北塔获得了一两黄金的奖励！
    let matcherGift = /^你在灵感.*塔获得了一.(.+)的奖励！$/
    //任务全局计划
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(relgtfloor, (tri, result) => {
                if (!LGT.Data.Entered) {
                    return true
                }
                LGT.Data.Level = App.CNumber.ParseNumber(result[1])
                LGT.LastLevel = LGT.Data.Level
                if (LGT.Data.Level == 2) {
                    LGT.Data.Ready = 1
                    LGT.Last = $.Now()
                } else {
                    LGT.Data.Ready = 0
                }
                return true
            })
            task.AddTrigger(matcherGift, (tri, result) => {
                let gift = result[1]
                LGT.Data.Gifts[gift] = (LGT.Data.Gifts[gift] || 0) + 1
                return true

            })
            task.AddTrigger(matcherWuchi, (tri, result) => {
                // App.Reconnect(0, LGT.Connect)
                return true
            })
            task.AddTrigger(matcherLeft, (tri, result) => {
                LGT.Data.灵符 = result[1] - 0
                if (LGT.Data.Ready == 0) {
                    LGT.Data.Ready = 1
                } else {
                    App.Commands.Drop()
                    LGT.Check()
                }
                return true
            })
            task.AddTrigger("你暂时还不能到上一层去！", (tri, result) => {
                LGT.Data.Ready = 1
                App.Map.DiscardMove()
                App.Commands.Drop()
                return true
            })
            task.AddTrigger("你还是解决目前的敌人吧", (tri, result) => {
                LGT.Data.Ready = 1
                App.Map.DiscardMove()
                App.Commands.Drop()
                return true
            })
            task.AddTrigger("你大喝一声五官齐齐溢血，扑到窗户边挣扎着，一头从塔上栽了下去...", (tri, result) => {
                $.Next()
            })
            task.AddTrigger("你听到无数天魔在耳边吟唱嘶吼，莫大的压力使你开始神智迷糊了...", (tri, result) => {
                // LGT.Check()
                return true
            })
        })
    LGT.EnterFail = () => {
        Quest.Cooldown(30 * 60 * 1000)
        App.PushCommands(
            $.Do("l"),
            $.Sync(),
            $.Function(() => {
                App.Map.Room.ID = $.RID("fuben-lgtd")
                $.Next()
            }),
            // $.Timeslice(""),
        )
        App.Next()
    }
    LGT.TryEnter = () => {
        if (LGT.Data.Entry.length > 0) {
            LGT.Data.Current = LGT.Data.Entry.shift()
            App.PushCommands(
                $.Do(`l ${LGT.Data.Current}`),
                $.Sync(),
                $.Function(() => {
                    if (App.Map.Room.Data.Objects.Items.length == 0) {
                        $.Insert($.Plan(PlanEnter))
                    } else {
                        Note(`[${LGT.Data.Current}]房间有人`)
                        $.Insert($.Function(LGT.TryEnter))
                    }
                    $.Next()
                })
            )
            $.Next()
        } else {
            LGT.EnterFail()
        }
    }
    //尝试进塔的计划
    let PlanEnter = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.AddTrigger("本日闯关你已经试过了，明天中午十二点后请早。", () => {
                task.Data = "nextday"
                return true
            })
            LGT.Data.Entered = true
            App.Send("unride")
            App.Send(LGT.Data.Current)
            App.Sync()
        },
        (result) => {
            LGT.Data.Entered = false
            switch (result.Task.Data) {
                case "nextday":
                    Quest.Cooldown(8 * 60 * 60 * 1000)
                    App.Next()
                    return
                default:
                    if (LGT.Data.Level > 0) {
                        LGT.Data.Entered = true
                        Note("进入成功，等待传送")
                        return
                    } else {
                        $.PushCommands(
                            $.Nobusy(),
                            $.Function(LGT.TryEnter)
                        )
                        $.Next()
                        return
                    }

            }
        }
    )
    let matcherKnockFinish = /$你在灵感.+塔上成功敲钟之后，/
    //等待敲钟的计划
    let PlanKnock = new App.Plan(
        App.Map.Position,
        (task) => {
            Note("等待结算")
            LGT.Data.Entered = false
            // App.Core.Timeslice.Change("")
            task.AddTrigger(matcherKnockFinish)
            App.Send("knock zhong;i")
        },
        (result) => {
            Quest.Cooldown(8 * 60 * 60 * 1000)
            App.Next()
        }
    )
    //爬塔时的核心逻辑
    LGT.Check = () => {
        if (LGT.Data.灵符 >= 1) {
            LGT.Next()
        } else {
            App.Checker.GetCheck("weaponduration").Force()
            App.Checker.GetCheck("i").Force()
            $.PushCommands(
                $.Nobusy(),
                $.Plan(PlanKnock),
                $.Do("hp"),
                $.Sync(),
                $.Function(() => {
                    LGT.Data.Count++
                    let tihui = App.Data.Player.HP["体会"] - LGT.Data.LastTihui
                    if (tihui > 0) {
                        LGT.Data.Tihui += tihui
                    }
                    $.Next()
                }),
                $.Prepare(),
            )
            $.Next()
        }
    }
    //继续爬塔
    LGT.Next = () => {
        $.PushCommands(
            $.Nobusy(),
            $.Function(() => {
                App.Send("yun recover;yun regenerate")
                $.RaiseStage("prepare")
                $.Sync()
                $.Next()
            }),
            $.Path(["u"]),
            $.Function(LGT.Kill)
        )
        $.Next()
    }
    //等待超时，一般是战斗失败
    LGT.Wait = () => {
        if (App.Map.Room.Data.Objects.FindByName("灵感塔囚徒").First()) {
            Note("等待进入下一层")
            LGT.Data.Ready = 1
        } else {
            Note("无需等待，准备进入下一层")
            LGT.Check()
        }
    }
    //战斗修正后的的代码，检查环境对象
    LGT.AfterRest = () => {
        $.PushCommands(
            $.Do("#l"),
            $.Sync(),
            $.Function(LGT.Wait),
        )
        $.Next()
    }
    //叫杀
    LGT.Kill = () => {
        let tags = []
        for (i = 0; i <= LGT.Data.Level; i = i + 25) {
            tags.push(`lgt-${i}`)
        }
        $.PushCommands(
            $.CounterAttack("qiu tu", $.NewCombat("lgt").WithTags(...tags)),
            $.Function(() => {
                App.Core.Weapon.PickWeapon()
                $.Next()
            }),
            $.Noblind(),
            $.Function(() => {
                $.PushCommands(
                    $.Rest(),
                    $.Function(LGT.AfterRest),

                ).WithFailCommand($.Function(LGT.AfterRest))
                $.Next()
            })
        )
        $.Next()
    }
    //开始爬塔任务
    LGT.Start = function () {
        PlanQuest.Execute()
        LGT.Go()
    }
    //准备进塔
    LGT.Go = function () {
        LGT.Data.Entry = ["northeast", "southeast", "southwest", "northwest", "westup", "northup", "eastup", "southup", "up"]
        LGT.Data.Entered = false
        LGT.Data.Current = ""
        LGT.Data.Level = 0
        LGT.Data.灵符 = 0
        $.PushCommands(
            $.Prepare("", { WeaponDurationMin: 80 }),
            // $.Timeslice("灵感塔"),
            $.To("fuben-lgtd"),
            $.Do("hp"),
            $.Sync(),
            $.Function(() => {
                LGT.Data.LastTihui = App.Data.Player.HP["体会"]
                $.Next()
            }),
            $.Nobusy(),
            $.Function(LGT.TryEnter)
        )
        $.Next()
    }
    //定义任务
    let Quest = App.Quests.NewQuest("lgt")
    Quest.Name = "灵感塔"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.OnHUD = () => {
        let last = LGT.Last ? App.HUD.UI.FormatTime($.Now() - LGT.Last, true) : "-"
        return [
            new App.HUD.UI.Word("上次爬塔:"),
            new App.HUD.UI.Word(last, 5, true),
        ]
    }
    Quest.OnSummary = () => {
        let last = LGT.Last ? App.HUD.UI.FormatTime($.Now() - LGT.Last, true) : "-"
        return [
            new App.HUD.UI.Word("塔:"),
            new App.HUD.UI.Word(last, 5, true),
        ]
    }
    Quest.OnReport = () => {
        let last = LGT.Last ? App.HUD.UI.FormatTime($.Now() - LGT.Last) : "-"
        let gifts = Object.keys(LGT.Data.Gifts).map((gift) => `${gift}*${LGT.Data.Gifts[gift]}`).join(",")
        return [
            `灵感塔-上次爬塔:${last} 层数:${LGT.LastLevel} 累计次数:${LGT.Data.Count} 累计体会:${LGT.Data.Tihui}`,
            `灵感塔- 奖励:${gifts}`,
        ]
    }
    App.Core.Quest.AppendInitor((e) => {
        LGT.Data = {
            Level: 0,
            灵符: 0,
            Tihui: 0,
            Count: 0,
            Entered: false,
            Current: "",
            LastTihui: 0,
            Ready: 0,
            Entry: [],
            Gifts: {},
        }
    })

    // Quest.GetReady = function (q, data) {
    //     return
    // }
    Quest.Group = "lgt"
    Quest.Start = function (data) {
        LGT.Start(data)
    }
    Quest.GetReady = function (q, data) {
        if (App.Data.Player.Score["转生次数"] < 2) {
            return null
        }
        return () => { Quest.Start(data) }
    }

    App.Quests.Register(Quest)
    App.Quests.LGT = LGT
})