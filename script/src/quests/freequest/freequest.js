$.Module(function (App) {
    let Freequest = {}
    Freequest.Data = {}
    Freequest.Data.PrepareData = {}
    Freequest.Data.PrepareData[App.Core.Assets.PrepareDataKey] = [
        App.Core.Assets.ParseRule("#carry id=baijin he,zijin chui,tie guanyin,qiankun mao,baiyu bi,yu hulu,yu ping,tong xique,sijian ping,jin hulu,yinlou hua,jinlou hua,qingtong ding,tie ruyi,yu dai,jixue shi,ziyun sha,ye guangbei,jin gua"),
    ]

    Freequest.Data.Items = {}
    App.LoadLines("src/quests/freequest/items.txt", "|").forEach((data) => {
        Freequest.Data.Items[data[0]] = data[1]
    })
    Freequest.Data.AvaliableTypes = {}
    Freequest.Data.Mode = ""
    Freequest.Data.Count = 0
    Freequest.Data.Success = 0
    Freequest.Data.XiaoerList = []
    Freequest.Data.Current = {}
    App.Mapper.Database.APIListTraces(App.Mapper.HMM.APIListOption.New().WithKeys(["xiaoer"]))[0].Locations.forEach(item => {
        Freequest.Data.XiaoerList.push(item)
    })
    Freequest.GoAsk = function () {
        // let loc = App.Random(Freequest.Data.XiaoerList)
        Freequest.Data.Current = {}
        $.PushCommands(
            $.Prepare(),
            $.To(Freequest.Data.XiaoerList),
            $.Ask("xiao er", "rumor", 1),
            $.Function(Freequest.AfterAsk),
        )
        $.Next()
    }

    //店小二说道：最近正在盛传『追杀阳白作』这件事情呢！
    //店小二说道：倒是最近听有些客人说起『戈什哈的事』来。
    //店小二说道：前两天还听人家说起『运送布料』的事呢。
    //店小二说道：噢！楼上住店的那几个客人刚才说什么『一灯大师的事』呢。
    //店小二说道：最近正在盛传『追杀秦雉挚』这件事情呢！
    //店小二说道：你没有听到大家都在议论『寻找曹戡』吗？

    let matcherTopicZhuisha = "追杀(.+)"
    let matcherTopicBeiqi = "([^和]+)的事"
    let matcherTopicXunzhao = "寻找(.+)"
    let matcherTopicYunsong = "运送(.+)"
    let matcherTopicFeizei = "([飞|反]贼)(.+)"
    let matcherTopicShan = "(.+和.+)的事"
    Freequest.Data.TypeMap = {}
    Freequest.Data.TypeMap["追杀"] = {
        TopicChecker: function (topic) {
            let result = topic.match(matcherTopicZhuisha)
            if (result) {
                Freequest.Data.Current.Type = "追杀"
                Freequest.Data.Current.Target = result[1]
                return true
            }
            return false

        },
        AfterAsk: function () {
            Freequest.ZhuishaAskMore()
        },
    }
    Freequest.Data.TypeMap["备齐"] = {
        TopicChecker: function (topic) {
            let result = topic.match(matcherTopicBeiqi)
            if (result) {
                Freequest.Data.Current.Type = "备齐"
                Freequest.Data.Current.Target = result[1]
                return true
            }
            return false
        },
        AfterAsk: function () {
            Freequest.BeiqiAskMore()
        },
    }
    Freequest.Data.TypeMap["寻找"] = {
        TopicChecker: function (topic) {
            let result = topic.match(matcherTopicXunzhao)
            if (result) {
                Freequest.Data.Current.Type = Freequest.Data.Items[result[1]] ? "寻找" : "找人"
                Freequest.Data.Current.Target = result[1]
                return true
            }
            return false
        },
        AfterAsk: function () {
            Freequest.XunzhaoAskMore()
        },
    }
    Freequest.Data.TypeMap["运送"] = {
        TopicChecker: function (topic) {
            let result = topic.match(matcherTopicYunsong)
            if (result) {
                Freequest.Data.Current.Type = "运送"
                Freequest.Data.Current.Target = result[1]
                return true
            }
            return false
        },
        AfterAsk: function () {
            Freequest.YunsongAskMore()
        },
    }
    Freequest.Data.TypeMap["单正"] = {
        TopicChecker: function (topic) {
            let result = topic.match(matcherTopicShan)
            if (result) {
                Freequest.Data.Current.Type = "单正"
                Freequest.Data.Current.Target = result[1]
                return true
            }
            return false
        },
        AfterAsk: function () {
            $.Next()
        },
    }
    Freequest.Data.TypeMap["飞贼"] = {
        TopicChecker: function (topic) {
            let result = topic.match(matcherTopicFeizei)
            if (result) {
                Freequest.Data.Current.Type = result[1]
                Freequest.Data.Current.Target = result[2]
                return true
            }
            return false
        },
        AfterAsk: function () {
            Freequest.FeizeiAskMore()
        },
    }
    Freequest.Data.TypeMap["反贼"] = Freequest.Data.TypeMap["飞贼"]
    Freequest.Data.TypeMap["找人"] = Freequest.Data.TypeMap["寻找"]


    let matcherTopcic = /^店小二说道：.*『(.*)』/
    Freequest.AfterAsk = function () {
        if (App.Data.Ask.Result = "ok") {
            let answer = App.Data.Ask.Answers[0].Line.match(matcherTopcic)
            if (answer) {
                Note("得到话题 " + answer[1])
                Freequest.Data.Current.Topic = answer[1]
                for (let type of Object.keys(Freequest.Data.TypeMap)) {
                    if (Freequest.Data.TypeMap[type].TopicChecker(Freequest.Data.Current.Topic)) {
                        if (!Freequest.Data.AvaliableTypes[type]) {
                            $.Next()
                            return
                        }
                        Freequest.Data.TypeMap[type].AfterAsk()
                        return
                    }
                }
                Note(`无法识别的话题 ${Freequest.Data.Current.Topic}`)
            }
        }
    }

    Freequest.Search = function (area, after) {
        let zone = area.slice(0, 2)
        if (App.Zone.GetMap(zone)) {
            let wanted = $.NewWanted(Freequest.Data.Current.Target, zone).WithChecker(App.Zone.NameChecker)
            $.RaiseStage("prepare")
            $.PushCommands(
                $.Prepare("", Freequest.Data.PrepareData),
                $.Function(() => { App.Zone.Search(wanted) }),
                $.Function(after),
            )
            $.Next()
            return true
        }
        return false
    }

    //追杀XXX任务
    Freequest.ZhuishaAskMore = function () {
        $.PushCommands(
            $.Nobusy(),
            $.Ask("xiao er", `${Freequest.Data.Current.Topic}.${Freequest.Data.Current.Target}`, 5),
            $.Function(Freequest.ZhuishaAfterAskMore),
        )
        $.Next()
    }
    //店小二说道：哦，听说最近六大门派已经上南海一带找他去了，我看他这次是小命不保罗。

    //店小二说道：嘿，据说郑晴已经让人给做了。嘿！我早就料到他会没命。喏，又让我给说中了吧。
    //店小二接着说道：现在又传出消息，上次扰乱六大门派的主谋竟然不是他，原来另有其人，是一个叫什么百里茨祀的亡命徒。
    //店小二说道：唉呀呀，又来了一个打探消息的。听说那家伙收到风声，已经躲了起来。
    //店小二接着说道：不过前两天倒是有一伙人在店里歇脚，不知怎么的就谈起了他，听说好象是躲到杭州城去了。

    //店小二说道：你刚才没听到谣言么？听说那个陈奥发好象也挂了。你瞧瞧看，这就是惹是生非的下场。
    //店小二接着说道：不过现在又传出了消息，扰乱六大门派的主谋竟然也不是他，而是一个叫段都的人在幕后操纵。
    //店小二说道：我说这家伙耐性可真好，等到他同伴全死光了他才现身，啧啧。
    //店小二接着说道：不过看来他好运也不长，几大门派收到消息后已经直奔洛阳城找他去了。
    let matcherZhuishaNPC1 = /^店小二说道：哦，听说最近六大门派已经上(.+)找他去了，我看他这次是小命不保罗。$/
    let matcherZhuishaNPC2 = /^店小二说道：嘿，据说(.+)已经让人给做了。嘿！我早就料到他会没命。喏，又让我给说中了吧。$/
    let matcherZhuishaNPC2after = /^店小二接着说道：现在又传出消息，上次扰乱六大门派的主谋竟然不是他，原来另有其人，是一个叫什么(.+)的亡命徒。$/
    let matcherZhuishaNpc2Answer = /^店小二说道：唉呀呀，又来了一个打探消息的。听说那家伙收到风声，已经躲了起来。$/
    let matcherZhuishaNpc2Loc = /^店小二接着说道：不过前两天倒是有一伙人在店里歇脚，不知怎么的就谈起了他，听说好象是躲到(.+)去了。$/
    let matcherZhuishaNPC3 = /^店小二说道：你刚才没听到谣言么？听说那个(.+)好象也挂了。你瞧瞧看，这就是惹是生非的下场。$/
    let matcherZhuishaNPC3after = /^店小二接着说道：不过现在又传出了消息，扰乱六大门派的主谋竟然也不是他，而是一个叫(.+)的人在幕后操纵。$/
    let matcherZhuishaNPC3Answer = /^店小二说道：我说这家伙耐性可真好，等到他同伴全死光了他才现身，啧啧。$/
    let matcherZhuishaNPC3Loc = /^店小二接着说道：不过看来他好运也不长，几大门派收到消息后已经直奔(.+)找他去了。$/
    Freequest.ZhuishaAfterAskMore = function () {
        if (App.Data.Ask.Result == "ok") {
            let npc1area = App.Data.Ask.Answers[0].Line.match(matcherZhuishaNPC1)
            if (npc1area) {
                Note("得到线索，目标在 " + npc1area[1])
                Freequest.Data.Count++
                Freequest.Data.Current.Level = 1;
                if (Freequest.Search(npc1area[1], Freequest.ZhuishaKill)) {
                    return
                }
                Note(`未知的区域${npc1area[1]}`)
                return
            }
            if (App.Data.Ask.Answers[0].Line.match(matcherZhuishaNPC2)) {
                let npc2 = App.Data.Ask.Answers[1].Line.match(matcherZhuishaNPC2after)
                if (npc2) {
                    Note("得到线索，目标是 " + npc2[1])
                    Freequest.Data.Current.Level = 2;
                    Freequest.Data.Current.Target = npc2[1]
                    Freequest.ZhuishaAskMore()
                    return
                }
            }
            if (App.Data.Ask.Answers[0].Line.match(matcherZhuishaNpc2Answer)) {
                let npc1area = App.Data.Ask.Answers[1].Line.match(matcherZhuishaNpc2Loc)
                if (npc1area) {
                    Note("得到线索，目标在 " + npc1area[1])
                    Freequest.Data.Current.Level = 2;
                    Freequest.Data.Count++
                    if (Freequest.Search(npc1area[1], Freequest.ZhuishaKill)) {
                        return
                    }
                    Note(`未知的区域${npc1area[1]}`)
                    return
                }
            }

            if (App.Data.Ask.Answers[0].Line.match(matcherZhuishaNPC3)) {
                let npc3 = App.Data.Ask.Answers[1].Line.match(matcherZhuishaNPC3after)
                if (npc3) {
                    Note("得到线索，目标是 " + npc3[1])
                    Freequest.Data.Current.Level = 3;
                    Freequest.Data.Current.Target = npc3[1]
                    Freequest.ZhuishaAskMore()
                    return
                }
            }
            if (App.Data.Ask.Answers[0].Line.match(matcherZhuishaNPC3Answer)) {
                let npc1area = App.Data.Ask.Answers[1].Line.match(matcherZhuishaNPC3Loc)
                if (npc1area) {
                    Note("得到线索，目标在 " + npc1area[1])
                    Freequest.Data.Current.Level = 3;
                    Freequest.Data.Count++
                    if (Freequest.Search(npc1area[1], Freequest.ZhuishaKill)) {
                        return
                    }
                    Note(`未知的区域${npc1area[1]}`)
                    return
                }
            }
        }
        $.Next()
    }
    Freequest.ZhuishaKill = function () {
        if (App.Zone.Wanted.ID && App.Map.Room.Data.Objects.FindByName(Freequest.Data.Current.Target).First()) {
            $.Insert(
                $.Kill(App.Zone.Wanted.ID, App.NewCombat("zhuisha")),
                $.Function(Freequest.ZhuishaAskNext),
            )
        }
        $.Next()
    }
    Freequest.ZhuishaAskNext = function () {
        if (Freequest.Data.Current.Level < 3) {
            $.PushCommands(
                $.To(Freequest.Data.XiaoerList),
                $.Ask("xiao er", `${Freequest.Data.Current.Topic}.${Freequest.Data.Current.Target}`, 5),
                $.Function(Freequest.ZhuishaAfterAskMore),
            )
        } else {
            Note("追杀任务完成,全家死光光")
        }
        $.Next()
    }
    //寻找NPC任务
    //寻找道具任务
    Freequest.XunzhaoAskMore = function () {
        $.PushCommands(
            $.Nobusy(),
            $.Ask("xiao er", `${Freequest.Data.Current.Topic}`),
            $.Function(Freequest.XunzhaoAfterAskMore),
        )
        $.Next()
    }

    //店小二说道：听说符肖丢了紫金锤，有人说不知怎么的就落到了卢炙煞手中了。
    //店小二说道：哦，他呀，据说正在五毒教附近，大家都奔他去了，看来他不妙噢！
    //你向店小二打听有关『寻找玉葫芦.夏侯反沁』的消息。
    //店小二说道：哦，他呀，据说正在襄阳城，找他的玉葫芦呢！



    //店小二说道：听说徐恪和戚霸在长安城被仇家围追堵杀，双方火拼了几个时辰，真是壮烈。
    //店小二说道：这人武功不高，可是极重义气，跟他兄弟公良击失散后，便四处躲避仇家的追杀。
    //店小二又接着道：今上午听吃饭的几个家伙提起淳于浪，据说是躲到关外去了。
    //ask chunyu about 公良击
    //淳于浪说道：他是我同生共死的兄弟，可现在却不知他生在何处。
    //淳于浪说道：知道他在哪里么？快请他过来，跟他说兄弟这里危险。
    //淳于浪说道：那天我们遇到仇人追杀，不小心就和他失散了，唉。
    let matcherXunzhaoItem = /^店小二说道：听说(.+)丢了(.+)，有人说不知怎么的就落到了(.+)手中了。$/
    let matcherXunzhaoItemNPC1 = /^店小二说道：哦，他呀，据说正在(.+)，大家都奔他去了，看来他不妙噢！$/
    let matcherXunzhaoItemNPC2 = /^店小二说道：哦，他呀，据说正在(.+)，找他的.+呢！$/
    Freequest.XunzhaoAfterAskMore = function () {
        if (App.Data.Ask.Result == "ok") {
            let item = App.Data.Ask.Answers[0].Line.match(matcherXunzhaoItem)
            if (item) {
                Freequest.Data.Current.Loser = item[1]
                Freequest.Data.Current.ItemID = Freequest.Data.Items[Freequest.Data.Current.Target]
                if (Freequest.Data.Current.ItemID != null) {
                    Freequest.Data.Current.Item = Freequest.Data.Current.Current
                    Freequest.Data.Current.Keeper = item[3]
                    Freequest.Data.Current.Target = Freequest.Data.Current.Keeper
                    $.PushCommands(
                        $.Ask("xiao er", `${Freequest.Data.Current.Topic}.${Freequest.Data.Current.Target}`),
                        $.Function(Freequest.XunzhaoAfterAskKeeper),
                    )
                }
                $.Next()
                return
            }
        }
        $.Next()
    }
    Freequest.XunzhaoAfterAskKeeper = function () {
        if (App.Data.Ask.Result == "ok") {
            let npc1area = App.Data.Ask.Answers[0].Line.match(matcherXunzhaoItemNPC1)
            if (npc1area) {
                Note("得到线索，目标在 " + npc1area[1])
                Freequest.Data.Count++
                if (Freequest.Search(npc1area[1], Freequest.XunzhaoKillKeeper)) {
                    return
                }
                Note(`未知的区域${npc1area[1]}`)
                return
            }
        }
        $.Next()
    }
    Freequest.XunzhaoKillKeeper = function () {
        if (App.Zone.Wanted.ID && App.Map.Room.Data.Objects.FindByName(Freequest.Data.Current.Keeper).First()) {
            $.Insert(
                $.Kill(App.Zone.Wanted.ID, App.NewCombat("xunzhao")),
                $.Do(`get ${Freequest.Data.Current.ItemID} from corpse;i`),
                $.Sync(),
                $.Function(Freequest.XunzhaoAfterKillKeeper)
            )
        }
        $.Next()
    }
    Freequest.XunzhaoAfterKillKeeper = function () {
        if (App.Data.Item.List.FindByIDLower(Freequest.Data.Current.ItemID).First()) {
            Freequest.Data.Current.Target = Freequest.Data.Current.Loser
            $.PushCommands(
                $.Prepare("", Freequest.Data.PrepareData),
                $.To(Freequest.Data.XiaoerList),
                $.Ask("xiao er", `${Freequest.Data.Current.Topic}.${Freequest.Data.Current.Target}`),
                $.Function(Freequest.XunzhaoAfterAskLoser),
            )
        }
        $.Next()
    }
    Freequest.XunzhaoAfterAskLoser = function () {
        if (App.Data.Ask.Result == "ok") {
            let npc1area = App.Data.Ask.Answers[0].Line.match(matcherXunzhaoItemNPC2)
            if (npc1area) {
                Note("得到线索，目标在 " + npc1area[1])
                if (Freequest.Search(npc1area[1], Freequest.XunzhaoReturnItem)) {
                    return
                }
                Note(`未知的区域${npc1area[1]}`)
                return
            }
        }
        $.Next()
    }
    Freequest.XunzhaoReturnItem = function () {
        if (App.Zone.Wanted.ID && App.Map.Room.Data.Objects.FindByName(Freequest.Data.Current.Loser).First()) {
            $.PushCommands(
                $.Do(`give ${Freequest.Data.Current.ItemID} to ${App.Zone.Wanted.ID};i`),
                $.Sync()
            )
        }
        $.Next()
    }
    //XXX的事任务
    Freequest.BeiqiAskMore = function () {
        $.PushCommands(
            $.Nobusy(),
            $.Ask("xiao er", `${Freequest.Data.Current.Topic}`),
            $.Function(Freequest.BeiqiAfterAskMore),
        )
        $.Next()
    }
    Freequest.BeiqiAfterAskMore = function () {
    }
    Freequest.YunsongAskMore = function () {
        $.PushCommands(
            $.Nobusy(),
            $.Ask("xiao er", `${Freequest.Data.Current.Topic}`),
            $.Function(Freequest.YunsongAfterAskMore),
        )
        $.Next()
    }
    Freequest.YunsongAfterAskMore = function () {
    }
    Freequest.FeizeiAskMore = function () {
        $.PushCommands(
            $.Nobusy(),
            $.Ask("xiao er", `${Freequest.Data.Current.Topic}.${Freequest.Data.Current.Target}`),
            $.Function(Freequest.FeizeiAfterAskMore),
        )
        $.Next()
    }
    //店小二说道：哎，都说他在昆明城，找他的人好像可多了。
    let matcherFeizeiLoc = /^店小二说道：哎，都说他在(.+)，找他的人好像可多了。$/
    Freequest.FeizeiAfterAskMore = function () {
        if (App.Data.Ask.Result == "ok") {
            let npc1area = App.Data.Ask.Answers[0].Line.match(matcherFeizeiLoc)
            if (npc1area) {
                Note("得到线索，目标在 " + npc1area[1])
                Freequest.Data.Count++
                if (Freequest.Search(npc1area[1], Freequest.ZhuishaKill)) {
                    return
                }
                Note(`未知的区域${npc1area[1]}`)
                return
            }
        }
        $.Next()
    }
    Freequest.FeizeiKill = function () {
        if (App.Zone.Wanted.ID && App.Map.Room.Data.Objects.FindByName(Freequest.Data.Current.Target).First()) {
            $.Insert(
                $.Kill(App.Zone.Wanted.ID, App.NewCombat("feizei")),
            )
        }
        $.Next()
    }
    Freequest.OnSuccess = function () {
        if (App.Core.QuestLock.Freequest > 0) {
            App.Core.QuestLock.Freequest--
        }
        Freequest.Data.Success++
        Note(`完成fq任务${Freequest.Data.Success}次`)
    }



    let Quest = App.Quests.NewQuest("freequest")
    Quest.Name = "公共任务"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = ""
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("FQ:"),
            new App.Word(App.HUD.UI.ShortNumber(Freequest.Data.Success), 6, true),
        ]

    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("FQ:"),
            new App.Word(App.HUD.UI.ShortNumber(Freequest.Data.Success), 5, true),
        ]
    }
    Quest.OnReport = () => {
        return [`Freequest-总数:${Freequest.Data.Count} 成功:${Freequest.Data.Success}`]
    }

    //你为六大门派排除异己，你获得了三十六点经验、十二点潜能、二十九点
    //江湖阅历、十二点江湖威望、能力得到了提升。
    //你又做了件不义之事，你获得了一百八十四点负神、七点江湖阅历、三点
    //江湖威望、能力得到了提升。
    //你拿出玉葫芦(yu hulu)给夏侯反沁。
    //夏侯反沁大喜过望，对你说道：这位大师，太感谢了，老衲实在不知道该怎么报答你！
    //夏侯反沁掏出了一些黄金双手奉上，感激道：一点薄礼，不成敬意，不成敬意！
    //通过这次锻炼，你获得了三十七点经验、二十八点潜能、四十五点江湖阅
    //历、能力得到了提升。
    let matcherZhuisha = /^你为六大门派(排除|扫清)异己，/
    let matcherFanzei = /^你又做了件[侠|不]义之事，/
    let matcherXunzhao = /^你拿出[^() ]+\(.+\)给.+/
    let successCallback = (tri, result) => {
        Freequest.OnSuccess()
        return true
    }
    let planQuest = new App.Plan(App.Quests.Position,
        (task) => {
            task.AddTrigger(matcherZhuisha, successCallback)
            task.AddTrigger(matcherFanzei, successCallback)
            task.AddTrigger(matcherXunzhao, successCallback)
        },
    )

    Quest.Start = function (data) {
        data = data || ""
        data = data.trim()
        let quests = []
        Freequest.Data.AvaliableTypes = {}
        data.split(",").forEach(q => {
            q = q.trim()
            if (q != "") {
                quests.push(q)
            }
        })
        if (quests.length == 0) {
            quests = Object.keys(Freequest.Data.TypeMap)
        }
        quests.forEach(q => {
            Freequest.Data.AvaliableTypes[q] = true
        })
        planQuest.Execute()
        Freequest.GoAsk()
    }
    App.BindEvent("core.queststart", (e) => {
        Freequest.Data.Count = 0
        Freequest.Data.Success = 0
    })
    App.Quests.Register(Quest)
    App.Quests.Freequest = Freequest
})