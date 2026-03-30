//保护任务模块
$.Module(function (App) {
    let Baohu = {}
    //是否在NPC出现时重连
    Baohu.Reconnect = false
    //任务总数
    Baohu.Count = 0
    //连续任务
    Baohu.Continuous = 0
    //NPC信息
    Baohu.Good = 0
    Baohu.Bad = 0
    Baohu.Data = {}
    Baohu.Gifts = {}
    //加载默认NPC信息
    let matcherProtect = /^汪剑通点了点头，对你说道:蒙古人收买了一批武林败类,好象要暗杀(.*)，你去保护他一下。/
    //检查汪的回答
    Baohu.Check = () => {
        if (App.Data.Ask.Answers.length) {
            let answer = App.Data.Ask.Answers[0].Line
            if (answer == "汪剑通说道：襄阳的百姓岌岌可危，现在你能帮我筹备十两黄金吗？") {
                App.Send("give 10 gold to wang jiantong")
                Baohu.Start()
                return
            }
            let result = answer.match(matcherProtect)
            if (result) {
                Baohu.Data.Start = $.Now()
                Baohu.Go(result[1])
                return
            }
            App.Core.Timeslice.Change("")
            if (answer == `汪剑通说道：${App.Data.Player.Score.名字}，你上一次的任务还没完成!`) {
                App.Log(answer)
                Baohu.Fail()
                return
            }
            Quest.Cooldown(60000)
            App.Fail()
            return
        }
        Quest.Cooldown(300000)
        App.Fail()
    }
    //前往NPC位置
    Baohu.Go = (npcname) => {
        let npc = App.Core.NPC.Other[npcname];
        if (!npc) {
            App.Log(`未知的保护npc${npcname}`)
            App.Core.Timeslice.Change("")
            App.Fail()
            return
        }
        Baohu.Data.NPC = npc
        App.Zone.Wanted = $.NewIDLowerWanted(npc.ID)
        $.PushCommands(
            $.To(npc.Loc[0]),
            $.Rooms(npc.Loc, App.Zone.Finder),
            $.Function(Baohu.Arrive)
        )
        $.Next()
    }
    //重连处理
    Baohu.Connect = () => {
        App.Commands.Drop()
        PlanQuest.Execute()
        $.PushCommands(
            $.Function(App.Core.Emergency.CheckDeath),
            $.Do("hp"),
            $.Nobusy(),
            $.Rest(),
            $.Kill(`${GetVariable("id")}'s ${Baohu.Data.ID}`, App.NewCombat("baohu").WithTags(`baohu-${Baohu.Data.Type}`)),
            $.Function(Baohu.Finish),
        )
        $.Next()
    }
    let matcherHalt = /^你(身行向后一跃，跳出战圈不打了。|现在停不下来。)$/
    //战斗的计划
    let PlanCombat = new App.Plan(
        App.Positions["Combat"],
        (task) => {
            task.AddTrigger(matcherHalt, (tri, result) => {
                if (Baohu.Reconnect) {
                    App.Reconnect(0, Baohu.Connect)
                    return
                }
                return true
            })
        }
    )
    let baohuwait = 28 * 1000
    let matcherKill = /^你对(.+)的(黑衣人|邪派高手|绝世高手)喝道:大胆狂徒,竟敢在这撒野！！/
    //等待NPC出现的计划
    let PlanProtect = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherKill, (tri, result) => {
                if (result[1] != App.Data.Player.Score.名字) {
                    return true;
                }
                App.Send("halt")
                let id
                switch (result[2]) {
                    case "黑衣人":
                        id = "heiyi ren"
                        break
                    case "邪派高手":
                        id = "xiepai gaoshou"
                        break
                    case "绝世高手":
                        id = "jueshi gaoshou"
                        break
                }
                Baohu.Data.ID = id
                Baohu.Data.Type = result[2]
            }).WithName("ok")
            let wait = Baohu.Data.Start + baohuwait - $.Now()
            if (wait > 0) {
                task.AddTimer(wait, (timer) => {
                    Note("准备迎敌")
                    App.Send("halt")
                    App.Core.Heal.TryTouch()
                    $.RaiseStage("prepare")
                    $.RaiseStage("baohu-ready")
                    return true
                }).WithNoRepeat(true)
            }
            task.AddTimer(1100, () => {
                if (App.Core.Weapon.Touch) {
                    if (($.Now() - Baohu.Data.Start) < baohuwait) {
                        App.Send("halt")
                        App.Core.Heal.TryTouch()
                        $.RaiseStage("pause")
                        $.RaiseStage("wait")
                    }
                }
                return true
            })
            task.AddTimer(3000, () => {
                let d = (($.Now() - Baohu.Data.Start) / 1000).toFixed(0)
                Note(`保护开始${d}秒`)
                return true
            })
            task.AddTimer(60000, () => {
                App.Log("保护等待超时")
                return false
            }).WithName("timeout")
            $.RaiseStage("wait")
        },
        (result) => {
            if (result.Name == "ok") {
                $.PushCommands(
                    $.CounterAttack(`${GetVariable("id")}'s ${Baohu.Data.ID}`, App.NewCombat("baohu").WithTags(`baohu-${Baohu.Data.Type}`).WithPlan(PlanCombat)),
                    $.Function(Baohu.Finish),
                )
                $.Next()
                return
            }
            App.Send("halt")
            App.Log(`保护NPC${Baohu.Data.NPC.ID}失败`)
            Baohu.Fail()
        }
    )
    //任务成功，交任务
    Baohu.Finish = () => {
        $.PushCommands(
            $.To("wang jiantong"),
            $.Ask("wang jiantong", "保护完成"),
            $.Function(() => {
                $.RaiseStage("wait")
                $.Next()
            }),
            $.Wait(2000),
            $.Do("halt;i"),
            $.Sync(),
            $.Prepare("commonWithExp"),
        )
        $.Next()
    }
    //到达NPC位置
    Baohu.Arrive = () => {
        if (App.Map.Room.Data.Objects.FindByIDLower(Baohu.Data.NPC.ID).First()) {
            Note("找到NPC,开始保护")
            PlanProtect.Execute()
            return
        }
        Note("找不到NPC,尝试等待")
        PlanProtect.Execute()
    }
    //汪剑通对你说道:你已经连续完成了二百十六次任务。
    let matcherSuccess = /^汪剑通对你说道:你已经连续完成了(.+)次任务。$/
    let matcherGifts = /^汪剑通给了你一个『(.+)』和『(.+)』，作为奖励。$/
    let matcherGood = /^你吃下一个BUG烧卖，感觉自己BUG点增加了/
    let matcherBad = "你吃下一个BUG烧卖，一股霉味，赶忙吐了出来，看来是过期了。"
    //任务全局计划
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherSuccess, (tri, result) => {
                //记录连续保护次数
                Quest.Cooldown(60000)
                Baohu.Continuous = App.CNumber.ParseNumber(result[1])
                Note(Baohu.Continuous)
                Baohu.Count++
                return true
            })
            task.AddTrigger(matcherGifts, (tri, result) => {
                Baohu.Gifts[result[1]] = (Baohu.Gifts[result[1]] || 0) + 1
                Baohu.Gifts[result[2]] = (Baohu.Gifts[result[2]] || 0) + 1
                if (result[1] == "库存BUG烧卖") {
                    App.Send("eat shao mai")
                }
                if (result[2] == "库存BUG烧卖") {
                    App.Send("eat shao mai")
                }
                App.Send("bug")
                return true
            })
            task.AddTrigger(matcherGood, (tri, result) => {
                Baohu.Good++
                return true
            })
            task.AddTrigger(matcherBad, (tri, result) => {
                Baohu.Bad++
                return true
            })
        },
        (result) => {

        }
    )
    Baohu.Start = () => {
        Baohu.Data = {}
        PlanQuest.Execute()
        $.PushCommands(
            $.Prepare("", { GoldKeep: 10 }),
            $.Timeslice("保护"),
            $.To("wang jiantong"),
            $.Ask("wang jiantong", "保护人质"),
            $.Function(Baohu.Check)
        )
        $.Next()
    }
    App.Core.Quest.AppendInitor(() => {
        Baohu.Count = 0
        Baohu.Gifts = {}
        Baohu.Good = 0
        Baohu.Bad = 0

    })
    //任务定义
    let Quest = App.Quests.NewQuest("baohu")
    Quest.Name = "保护任务"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "baohu"
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("保护:"),
            new App.HUD.UI.Word(`${Baohu.Continuous}`, 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("保:"),
            new App.HUD.UI.Word(`${Baohu.Continuous}`, 5, true),
        ]
    }
    Quest.OnReport = () => {
        let d = $.Now() - App.Quests.StartAt
        let eff = d > 0 ? (Baohu.Count * 3600 * 1000 / d).toFixed(0) + "个/小时" : "-"
        let gifts = Object.keys(Baohu.Gifts).map((gift) => `${gift}*${Baohu.Gifts[gift]}`).join(",")
        return [`保护任务- 连续:${Baohu.Continuous} 共计:${Baohu.Count} 毛效率:${eff} 好烧卖:${Baohu.Good} 坏烧卖:${Baohu.Bad}`, `保护奖励:${gifts}`]
    }

    Quest.Start = function (data) {
        // Baohu.Reconnect = data.trim() == "recon"
        Baohu.Start()
    }
    App.Quests.Register(Quest)
    App.Quests.Baohu = Baohu
})