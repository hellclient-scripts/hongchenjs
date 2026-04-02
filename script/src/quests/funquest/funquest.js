$.Module(function (App) {
    let actionModule = App.RequireModule("helllibjs/conditions/action.js")

    let Funquest = {}
    Funquest.Current = 0
    Funquest.Success = 0
    Funquest.Gifts = {}
    class Data {
        Publisher = ""
        Type = ""
        ID = ""
        Object = ""
        Target = []
        Name = ""
        Zone = ""
        Amount = 0
        LastRoom = ""
        Ask = ""
    }
    let PrepareContext = {
        [App.Core.Goods.PrepareDataKey]: [actionModule.Parse("#buy cutton padded").ParseNumber()],
    }
    //你已经连续完成了 1 个趣味任务，继续加油努力啊！
    let matcherFunquest = /^你已经连续完成了\s+(\d+)\s+个趣味任务，继续加油努力啊！$/
    let matcherNoQuest = "你现在没有领任何趣味任务！"
    //目前钱眼开让你猜个谜语:半局残棋对一（猜一字）你必须在五分钟内回答！
    let matcherCodeQuest = /^目前(.+)让你猜个谜语:(.+)你必须在.+分钟内回答！$/
    //目前张德贵让你去找大理薛记成衣铺的薛老板打听线索。
    let matcherClueQuest = /^目前(.+)让你去找[^的]+的(.+)打听线索。$/
    //目前薛老板让你帮他去找竹棒。
    let matcherItemQuest = /^目前(.+)让你帮他去找(.+)。$/
    //目前刘素素让你把他的远房亲戚薛虹步带去衡山的南天门。
    let matcherSendQuest = /^目前(.+)让你把他的远房亲戚(.+)带去([^的]+)的(.+)。$/
    //目前甄有庆让你把一封信交到大理薛记成衣铺的薛老板手里。
    let matcherLetterQuest = /^目前(.+)让你把一封信交到[^的]+的(.+)手里。$/
    //目前薛老板让你把回执交回给甄有庆。
    let matcherLetterQuest2 = /^目前(.+)让你把回执交回给(.+)。$/
    //目前归二娘让你把一个包裹埋到长安城的关洛道去，再把那里的地形画下来交给他。
    let matcherMapQuest = /^目前(.+)让你把一个包裹埋到([^的]+)的(.+)去，再把那里的地形画下来交给他。$/

    let matcherSilver = /^目前(.+)让你付给他(.+)两白银换线索。$/
    let PlanFunquest = new App.Plan(App.Positions["Response"],
        (task) => {
            Funquest.Data = new Data()
            task.AddTrigger(matcherFunquest, (tri, result) => {
                Funquest.Current = parseInt(result[1])
                return true
            })
            task.AddTrigger(matcherNoQuest, (tri, result) => {
                Funquest.Current = 0
                Funquest.Data.Type = "start"
                return true
            })
            task.AddTrigger(matcherCodeQuest, (tri, result) => {
                Funquest.Data.Type = "code"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Object = result[2].trim()
                return true
            })
            task.AddTrigger(matcherClueQuest, (tri, result) => {
                Funquest.Data.Type = "clue"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Name = result[2]
                return true
            })
            task.AddTrigger(matcherItemQuest, (tri, result) => {
                Funquest.Data.Type = "item"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Object = result[2]
                return true
            })
            task.AddTrigger(matcherSendQuest, (tri, result) => {
                Funquest.Data.Type = "send"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Name = result[2]
                Funquest.Data.Zone = result[3]
                Funquest.Data.Object = result[4]
                return true
            })
            task.AddTrigger(matcherLetterQuest, (tri, result) => {
                Funquest.Data.Type = "letter"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Name = result[2]
                return true
            })
            task.AddTrigger(matcherLetterQuest2, (tri, result) => {
                Funquest.Data.Type = "letter2"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Name = result[2]
                return true
            })
            task.AddTrigger(matcherMapQuest, (tri, result) => {
                Funquest.Data.Type = "map"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Zone = result[2]
                Funquest.Data.Object = result[3]
                return true
            })
            task.AddTrigger(matcherSilver, (tri, result) => {
                Funquest.Data.Type = "silver"
                Funquest.Data.Publisher = result[1]
                Funquest.Data.Amount = App.CNumber.ParseNumber(result[2])
                return true
            })
            App.Send("funquest")
            App.Sync()
        },
        (result) => {
            if (Funquest.Data.Type == "") {
                App.Log("未知的Funquest类型")
                Funquest.Fail()
                return
            }
            $.Next()
        }
    )
    Funquest.Check = () => {
        $.PushCommands(
            $.Plan(PlanFunquest),
        )
        $.Next()
    }
    Funquest.Data = new Data()
    Funquest.LastData = null
    Funquest.CodeMap = {}
    App.LoadLines("src/quests/funquest/code.txt", ":").forEach((data) => {
        Funquest.CodeMap[data[0]] = data[1]
    })
    Funquest.GetPreapreContext = () => {
        if (App.Core.Player.GetSkillLevenByID("force") < 300) {
            return PrepareContext
        }
        return {}
    }
    Funquest.Go = () => {
        Funquest.Data = new Data()
        $.PushCommands(
            $.Prepare("commonWithExp", Funquest.GetPreapreContext()),
            $.Function(Funquest.Check),
            $.Function(() => {
                switch (Funquest.Data.Type) {
                    case "start":
                        Funquest.DoStart()
                        return
                    case "clue":
                        Funquest.GoClue()
                        return
                }
                Note(`有未完成的Funquest ${Funquest.Data.Type}`)
                Funquest.Fail()
            })
        )
        $.Next()
    }
    //紫虚道人盯着你看了看，说道：“一小时内只能取消五次任务！”
    let matcherCancelTooMany = /^紫虚道人盯着你看了看，说道：“一小时内只能取消.+次任务！”$/
    let matcherCancel = "紫虚道人盯着你看了看，说道：“嗯，有那么几次挫折是很正常的，"

    let PlanCancel = new App.Plan(App.Positions["Response"],
        (task) => {
            task.AddTrigger(matcherCancelTooMany, (tri, result) => {
                App.Log("取消过多，无法继续接任务")
                Quest.Cooldown(600000)
                return true
            })
            task.AddTrigger(matcherCancel, (tri, result) => {
                Quest.Cooldown(60000)
                return true
            })
            App.Send("yun regenerate;ask zixu daoren about 取消;score")
            App.Sync()
        }
        , (result) => {
            $.Next()
        }
    )
    Funquest.Fail = () => {
        App.Log("任务失败")
        App.Commands.Drop()
        $.PushCommands(
            $.To("zixu daoren"),
            $.Plan(PlanCancel),
        )
        $.Next()
    }
    let matcherRegive = "你老是连着给东西人家不烦吗?"
    let matcherReask = "你老是连着问人家不烦吗?"
    let PlanAsk = new App.Plan(App.Positions["Response"],
        (task) => {
            task.Data = ""
            if (Funquest.Data.Ask == "") {
                App.Log("未知的Funquest问话")
                Funquest.Fail()
                return
            }
            task.AddTrigger(matcherReask, (tri, result) => {
                task.Data = "retry";
                return true
            })
            task.AddTrigger(matcherRegive, (tri, result) => {
                task.Data = "retry";
                return true
            })
            App.Send("yun regenerate")
            App.Send(`${Funquest.Data.Ask}`)
            App.Sync()
        }, (result) => {
            if (result.Task.Data == "retry") {
                Note("等待重试")
                $.RaiseStage("wait")
                $.Insert(
                    $.Wait(1000),
                    $.Do("halt"),
                    $.Plan(PlanAsk),
                )
            }
            $.Next()
        }
    )

    let matcherClue = /^([^：()\[\]]{2,5})在你耳边悄悄说道：“你不妨去找.+的(.+)打听打听，他那里可能有些线索。”/;
    let matcherNeedCancel = "紫虚道人盯着你看了看，说道：“你现在有任务在身，要是完成不了就先和我说一声取消。”"
    let matcherCooldown = "紫虚道人盯着你看了看，说道：“你刚取消过一次任务，先喝口水歇会儿再接着领下一个吧。”"
    let matcherHighExp = "紫虚道人盯着你看了看，说道：“您这种身手这种差事不太适合你了，你走吧。”"
    let PlanZixu = new App.Plan(App.Positions["Response"],
        (task) => {
            task.AddTrigger(matcherClue, (tri, result) => {
                task.Data = "clue"
                return true
            })
            task.AddTrigger(matcherNeedCancel, (tri, result) => {
                task.Data = "cancel"
                return true
            })
            task.AddTrigger(matcherCooldown, (tri, result) => {
                task.Data = "cooldown"
                return true
            })
            task.AddTrigger(matcherHighExp, (tri, result) => {
                task.Data = "highexp"
                return true
            })
            App.Send("yun regenerate;ask zixu daoren about 任务")
            App.Sync()
        },
        (result) => {
            switch (result.Task.Data) {
                case "clue":
                    Funquest.Go()
                    return
                case "cancel":
                    Funquest.Fail()
                    return
                case "cooldown":
                    Quest.Cooldown(60000)
                    return
                case "highexp":
                    Quest.Cooldown(36000000)
                    return
            }
            App.Log("没有得到线索")
            App.Fail()
        }
    )
    Funquest.DoStart = () => {
        $.PushCommands(
            $.To("zixu daoren"),
            $.Plan(PlanZixu),
        )
        $.Next()
    }
    Funquest.LoadNPC = (npcname) => {
        let npc = App.Core.NPC.Other[npcname];
        if (!npc) {
            App.Log(`未知的Funquest npc${npcname}`)
            App.Fail()
            return
        }
        return npc
    }
    Funquest.GoNPC = (npcname, nofail) => {
        let npc = Funquest.LoadNPC(npcname);
        App.Zone.Wanted = $.NewIDLowerWanted(npc.ID)
        $.PushCommands(
            $.Nobusy(),
            $.To(npc.Loc[0]),
            $.Rooms(npc.Loc, App.Zone.Finder),
            $.Function(() => {
                if (App.Map.Room.Data.Objects.FindByIDLower(npc.ID).First() == null) {
                    App.Log(`没有找到NPC${npcname}`)
                    if (nofail) {
                        App.Commands.Drop()
                        $.Next()
                        return
                    }
                    Funquest.Fail()
                    return
                }
                $.Next()
            })
        )
        $.Next()

    }
    Funquest.GoClue = () => {
        $.PushCommands(
            $.Prepare(),
            $.Function(() => { Funquest.GoNPC(Funquest.Data.Name, true) }),
            $.Function(Funquest.ClueArrive)
        )
        $.Next()
    }
    Funquest.ClueArrive = () => {
        let npc = Funquest.LoadNPC(Funquest.Data.Name);
        Funquest.Data.Ask = `ask ${npc.ID.toLowerCase()} about 线索`
        $.PushCommands(
            $.Plan(PlanAsk),
            $.Function(Funquest.Check),
            $.Function(Funquest.Execute),
        )
        $.Next()
    }
    Funquest.Execute = () => {
        switch (Funquest.Data.Type) {
            case "clue":
                Funquest.GoClue()
                return
            case "silver":
                Funquest.DoSilver()
                return
            case "code":
                Funquest.DoCode()
                return
            case "item":
                Funquest.DoItem()
                return
            case "send":
                Funquest.DoSend()
                return
            case "letter":
                Funquest.DoLetter()
                return
            case "letter2":
                Funquest.Fail()
                return
            case "map":
                Funquest.DoMap()
                return
        }
    }
    Funquest.DoSilver = () => {
        let sum = App.Data.Item.List.FindByIDLower("gold").Sum()
        if (sum < 1) {
            $.PushCommands(
                $.Nobusy(),
                $.To("qz"),
                $.Do(`qu 1 gold`),
                $.Function(Funquest.DoSilverGive)
            )
            $.Next()
            return
        }
        Funquest.DoSilverGive()
    }
    Funquest.DoSilverGive = () => {
        let npc = Funquest.LoadNPC(Funquest.Data.Publisher);
        Funquest.Data.Ask = `give 1 gold to ${npc.ID.toLowerCase()};i`
        $.PushCommands(
            $.Function(() => { Funquest.GoNPC(Funquest.Data.Publisher) }),
            $.Nobusy(),
            $.Plan(PlanAsk),
            $.Nobusy(),
            $.Function(Funquest.Check),
            $.Function(Funquest.Execute),
        )
        $.Next()
    }
    Funquest.DoItem = () => {
        let item = App.Data.Item.List.FindByName(Funquest.Data.Object).First()
        if (item == null) {
            let goods = App.Goods.GetGoodsByName(Funquest.Data.Object)
            if (!goods.length) {
                App.Log("无法购买的物品：" + Funquest.Data.Object)
                Funquest.Fail()
                return
            }
            $.Insert(
                $.Nobusy(),
                $.Buy(goods[0].Key),
                $.Function(Funquest.DoItemGive)
            );
            $.Next()
            return
        }
        Funquest.DoItemGive()
    }
    Funquest.DoItemGive = () => {
        let item = App.Data.Item.List.FindByName(Funquest.Data.Object).First()
        if (item == null) {
            App.Log(`没有找到线索对应的物品，道具是${Funquest.Data.Object}`)
            return
        }
        let npc = Funquest.LoadNPC(Funquest.Data.Publisher);
        Funquest.Data.Ask = `remove ${item.ID};unwield ${item.ID};remove ${item.ID.toLowerCase()};unwield ${item.ID.toLowerCase()};give ${item.ID} to ${npc.ID.toLowerCase()};give ${item.ID.toLowerCase()} to ${npc.ID.toLowerCase()};i`
        $.PushCommands(
            $.Function(() => { Funquest.GoNPC(Funquest.Data.Publisher) }),
            $.Plan(PlanAsk),
            $.Nobusy(),
        )
        $.Next()
    }
    Funquest.DoCode = () => {
        let code = Funquest.CodeMap[Funquest.Data.Object]
        if (!code) {
            App.Log(`没有找到线索对应的代码，线索是${Funquest.Data.Object}`)
            Funquest.Fail()
            return
        }
        let npc = Funquest.LoadNPC(Funquest.Data.Publisher);
        Funquest.Data.Ask = `ask ${npc.ID.toLowerCase()} about ${code}`
        $.RaiseStage("wait")
        $.PushCommands(
            $.Wait(5000),
            $.Do("halt"),
            $.Nobusy(),
            $.Plan(PlanAsk),
            $.Nobusy(),
        )
        $.Next()
    }
    Funquest.DoLetter = () => {
        let npc = Funquest.LoadNPC(Funquest.Data.Publisher);
        let target = Funquest.LoadNPC(Funquest.Data.Name)
        Funquest.Data.Ask = `give letter to ${target.ID.toLowerCase()};i`
        $.PushCommands(
            $.Function(() => { Funquest.GoNPC(Funquest.Data.Name) }),
            $.Nobusy(),
            $.Plan(PlanAsk),
            $.Sync(),
            $.Function(() => { Funquest.GoNPC(Funquest.Data.Publisher) }),
            $.Function(() => {
                Funquest.Data.Ask = `give receipt to ${npc.ID.toLowerCase()};i`
                $.Next()
            }),
            $.Plan(PlanAsk),
            $.Nobusy(),
        )
        $.Next()
    }
    Funquest.DoMap = () => {
        let result = App.Core.RoomsByName[Funquest.Data.Object] || []
        let npc = Funquest.LoadNPC(Funquest.Data.Publisher);
        if (!result.length) {
            App.Log(`Funquest在区域${Funquest.Data.Zone}中没有找到房间${Funquest.Data.Object}`)
            Funquest.Fail()
            return
        }
        Funquest.Data.Ask = `give paper to ${npc.ID.toLowerCase()}; i`
        $.PushCommands(
            $.Nobusy(),
            $.Buy("paper"),
            $.Nobusy(),
            $.To(result[0]),
            $.Do("bury bag"),
            $.Nobusy(),
            $.Do("draw here"),
            $.Nobusy(),
            $.Function(() => { Funquest.GoNPC(Funquest.Data.Publisher) }),
            $.Nobusy(),
            $.Plan(PlanAsk),
            $.Nobusy(),
        )
        $.Next()
    }
    Funquest.DoSend = () => {
        if (Funquest.Data.Name == "") {
            App.Log("Funquest护送NPC名字无效")
            Funquest.Fail()
            return
        }
        $.PushCommands(
            $.Function(() => { App.Look(); $.Next() }),
            $.Sync(),
            $.Function(() => {
                Funquest.SendNPC(Funquest.Data.Name, Funquest.Data.Zone, Funquest.Data.Object)
            })
        )
        $.Next()
    }
    Funquest.SendNPC = (npcname, zonename, roomname) => {
        Funquest.Data.Name = npcname
        Funquest.Data.LastRoom = App.Map.Room.ID
        //let result = App.Zone.FilterRoomnameInZone(zonename, roomname)
        let result = App.Core.RoomsByName[roomname] || []
        if (!result.length) {
            App.Log(`Funquest在区域${zonename}中没有找到房间${roomname}`)
            Funquest.Fail()
            return
        }
        Funquest.Data.Target = result
        Funquest.SendNPCWalk()
    }
    Funquest.SendNPCOption = (move, map) => {
        move.OnArrive = Funquest.SendNPCArrive
        move.Option.CommandNotContains = ["cross", "jump ", "enter "]
    }
    Funquest.ResendNPC = () => {
        Note("NPC跟丢了")
        App.Commands.Drop()
        $.PushCommands(
            $.To(Funquest.Data.LastRoom),
            $.Function(() => {
                $.RaiseStage("wait")
                $.Next()
            }),
            $.Wait(1000),
            $.Do("halt"),
            $.Function(Funquest.SendNPCWalk),
        )
        $.Next()
    }
    Funquest.SendNPCArrive = (move, map) => {
        Note("检查")
        let snap = App.Map.Snap()
        $.Insert(
            $.Sync(),
            $.Function(() => {
                if (App.Map.Room.Data["funquest.sendnpcinroom"] != Funquest.Data.Name) {
                    $.Insert(
                        $.Function(() => {
                            App.Look()
                            App.Next()
                        }),
                        $.Sync(),
                        $.Function(() => {
                            if (App.Map.Room.Data.Objects.FindByName(Funquest.Data.Name).First() == null) {
                                Funquest.ResendNPC();
                                return
                            }
                            $.Next()
                        })
                    )
                }
                $.Next()
            }),
            $.Function(() => {
                Note("继续")
                Funquest.Data.LastRoom = App.Map.Room.ID
                App.Map.Rollback(snap)
                move.Walk(map)
            })
        )
        $.Next()
    }
    Funquest.SendNPCWalk = () => {
        if (App.Map.Room.Data.Objects.FindByName(Funquest.Data.Name).First() == null) {
            App.Log(`Funquest NPC${Funquest.Data.Name}失踪了`)
            Funquest.Fail()
            return
        }
        Note("开始护送")
        $.PushCommands(
            $.To(
                Funquest.Data.Target,
                App.Map.SingleStep(),
                App.Map.NoFly(),
                Funquest.SendNPCOption,
            ),
            $.Function(Funquest.SendNPCWalkFinsh)
        )
        $.Next()
    }
    let PlanSendFinish = new App.Plan(App.Positions["Response"],
        (task) => {
            task.AddTrigger(matcherSendok)
            task.AddTimer(2000, (timer, result) => {
                Note("等老汉挂")
                return true
            })
            task.AddTimer(10000).WithName("timeout")
            $.RaiseStage("wait")
        },
        (result) => {
            App.Send("halt")
            if (result.Name == "timeout") {
                App.Send("funquest");
                App.Look()
                $.PushCommands(
                    $.Sync(),
                    $.Function(() => {
                        App.Log('趣味任务老汉碰瓷了')
                        $.Next()
                    })
                )
            }
            $.Next()
        }
    )
    Funquest.SendNPCWalkFinsh = () => {
        Note("护送结束")
        $.Insert(
            $.Plan(PlanSendFinish),
            $.Nobusy(),
        )
        $.Next()
    }
    App.Core.Quest.AppendInitor(() => {
        Funquest.Current = 0
        Funquest.Success = 0
        Funquest.Gifts = {}
    })
    Funquest.GetEff = function () {
        return Funquest.Success * 3600 * 1000 / ($.Now() - App.Quests.StartAt)
    }
    Funquest.GetTimesliceEff = function () {
        let ts = App.Core.Timeslice.Get(Quest.Timeslice)
        return ts ? Funquest.Success * 3600 * 1000 / ts : 0
    }

    let Quest = App.Quests.NewQuest("funquest")
    Quest.Name = "趣味任务"
    Quest.Timeslice = "趣味任务"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "funquest"
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("趣味任务:"),
            new App.HUD.UI.Word(Funquest.Success, 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("趣:"),
            new App.HUD.UI.Word(Funquest.Success, 5, true),
        ]
    }
    Quest.OnReport = () => {
        let eff = Funquest.Success > 3 ? Funquest.GetEff().toFixed(0) + "个/小时" : "-"
        let timesliceeff = Funquest.Success > 3 ? Funquest.GetTimesliceEff().toFixed(0) + "个/小时" : "-"

        let gifts = Object.keys(Funquest.Gifts).map((gift) => `${gift}*${Funquest.Gifts[gift]}`).join(",")
        return [
            `趣味任务-成功:${Funquest.Success} 当前:${Funquest.Current} 毛效率:${eff} 净效率:${timesliceeff}`,
            `趣味任务-奖励:${gifts}`,
        ]
    }
    //慕容染走了过来。
    let matcherNpcFollow = /^(.+)走了过来。$/
    //通过这次锻炼，你获得了二百六十二点经验，一百四十四点潜能以及十点实战体会。
    let matcherSuccess = /^通过这次锻炼，你获得了.+点经验，.+点潜能以及.+点实战体会。$/
    //牛华从怀里掏出一些白银交给你，说道：“这点算是这一路上的车马费。辛苦你了！”
    let matcherSendok = /^(.+)从怀里掏出一些白银交给你，说道：“这点算是这一路上的车马费。辛苦你了！”$/
    let matcherGift = /^你获得了一.(.+)$/
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherSuccess, (tri, result) => {
                Funquest.Success++
                Funquest.Current++
                return true
            })
            task.AddTrigger(matcherNpcFollow, (tri, result) => {
                if (Funquest.Data.Type == "send" && result[1] == Funquest.Data.Name) {
                    App.Map.Room.Data["funquest.sendnpcinroom"] = result[1]
                    Note("NPC跟上了")
                }
                return true
            })
            task.AddTrigger(matcherSendok, (tri, result) => {
                if (Funquest.Data.Type == "send" && result[1] == Funquest.Data.Name) {
                    App.Map.Room.Data["funquest.sendnpcinroom"] = result[1]
                }
                return true
            })
            task.AddTrigger(matcherGift, (tri, result) => {
                let gift = result[1]
                Funquest.Gifts[gift] = (Funquest.Gifts[gift] || 0) + 1
                return true
            })
        })
    Quest.Start = function (data) {
        PlanQuest.Execute()
        Funquest.Go()
    }
    Quest.GetReady = function (q, data) {
        return () => { Quest.Start(data) }
    }
    App.Quests.Register(Quest)
    Funquest.Retry = () => {
        PlanQuest.Execute()
        App.Look()
        App.PushCommands(
            $.Function(Funquest.Check),
            $.Function(Funquest.Execute),
        )
        App.Next()
    }
    App.Quests.Funquest = Funquest
})