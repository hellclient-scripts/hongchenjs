//房屋核查模块
$.Module(function (App) {
    var ScanHouse = {}
    let Blacklist={
        "dengta":true,//洪门小院出口错误
    }
    ScanHouse.Data = {
        HouseList: [],
        CurrentHouse: null,
        Records: [],
    }
    let Quest = App.Quests.NewQuest("scanhouse")
    Quest.Name = "房产盘查"
    Quest.Desc = "盘查全部房产信息"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Start = function (data) {
        ScanHouse.Start(data)
    }
    ScanHouse.Start = function (data) {
        ScanHouse.Data = {
            Remain: Object.keys(App.Zone.LocToCityList),
            HouseList: [],
            Records: [],
            BlackList: {},
        }
        ScanHouse.Data.Remain = ScanHouse.Data.Remain.filter(r => r != App.Mapper.Data.Markers["gc"])
        commands = []
        commands.push($.Function(ScanHouse.Next))
        App.Commands.PushCommands(...commands)
        Quest.Cooldown(3600)
        App.Next()

    }
    ScanHouse.Next = () => {
        if (ScanHouse.Data.Remain.length == 0) {
            ScanHouse.NextHouse()
            return
        }
        if (!App.Quests.Stopped) {
            if (App.Map.Room.ID) {
                ScanHouse.Data.Remain = ScanHouse.Data.Remain.filter(r => r != App.Map.Room.ID)
                //ScanHouse.Current = ScanHouse.Data.Remain.shift()
                ScanHouse.Current = App.Map.GetNearestRoom(App.Map.Room.ID, true, ScanHouse.Data.Remain)
                if (ScanHouse.Current == null) {
                    ScanHouse.NextHouse()
                    return
                }
                ScanHouse.Data.Remain = ScanHouse.Data.Remain.filter(r => r != ScanHouse.Current)
                $.Insert($.Function(ScanHouse.Next))
                App.Commands.PushCommands(
                    $.Function(ScanHouse.ProcessNext),
                )
            } else {
                $.Insert($.Function(ScanHouse.Next))
                App.Commands.PushCommands(
                    $.To("gc"),
                )
            }
        }
        $.Next()
    }
    ScanHouse.ProcessNext = () => {
        ScanHouse.StartPoint = "";
        print(`前往 ${ScanHouse.Current}`)
        App.Commands.PushCommands(
            $.Sync(),
            $.Prepare(),
            $.To(ScanHouse.Current, App.Map.NewTag("streetview", 1)),
            $.Function(ScanHouse.Arrive)
        ).WithFailCommand($.Function(ScanHouse.Fail))
        $.Next()

    }
    ScanHouse.Fail = () => {
        print(`处理 ${ScanHouse.Current} 失败`)
        $.Next()
    }
    ScanHouse.Scan = () => {
        App.Map.Room.Exits.forEach(exit => {
            if (App.Mapper.CommonExits.indexOf(exit) < 0 && !Blacklist[exit]) {
                ScanHouse.Data.HouseList.push({
                    Room: App.Map.Room.ID,
                    HouseID: exit,
                })
                Note(`发现房产${exit}，位于 ${App.Map.Room.ID}`)
            }
        });

    }
    ScanHouse.Arrive = () => {
        if (App.Map.Room.ID == ScanHouse.Current) {
            ScanHouse.Scan()
            Note("当前房间盘查完毕")
        } else {
            Note("房间位置不正确，跳过扫描")
        }
        Note(`剩余 ${ScanHouse.Data.Remain.length} 个房间未盘查`)
        $.Next()
    }
    ScanHouse.NextHouse = () => {
        let house = ScanHouse.Data.HouseList.shift()
        if (house) {
            ScanHouse.VerifyHouse(house.Room, house.HouseID)
        } else {
            ScanHouse.Finish()
        }
        return
    }
    ScanHouse.VerifyHouse = (room, houseid) => {
        ScanHouse.Data.CurrentHouse = {
            Room: room,
            ID: houseid,
        }
        $.PushCommands(
            $.To(room),
            $.Path([`go ${houseid}`]),
            $.Function(ScanHouse.EnterHouse),
        )
        $.Next()
    }
    ScanHouse.EnterHouse = () => {
        let roomname = App.Map.Room.Name
        if (roomname.endsWith("大院")) {
            let panlongname = roomname.slice(0, -2)
            ScanHouse.Data.CurrentHouse.Name = panlongname
            ScanHouse.Data.CurrentHouse.Type = "盘龙"
            Note(`房屋类型:盘龙,建筑名【${panlongname}】`)
            ScanHouse.Data.Records.push(ScanHouse.Data.CurrentHouse)
        } else if (roomname.endsWith("小院")) {
            let buildname = roomname.slice(0, -2)
            ScanHouse.Data.CurrentHouse.Name = buildname
            ScanHouse.Data.CurrentHouse.Type = "小院"
            Note(`房屋类型:${ScanHouse.Data.CurrentHouse.Type},建筑名【${buildname}】`)
            ScanHouse.Data.Records.push(ScanHouse.Data.CurrentHouse)
        } else {
            App.Log(`无法识别的房间类型 【${roomname}】,${ScanHouse.Data.CurrentHouse.ID}@${ScanHouse.Data.CurrentHouse.Room}`)
            Note("无法识别")
        }
        // let rid=ScanHouse.Data.CurrentHouse.Room
        //部分房间有问题，不能记住rid返回
        $.Insert($.Function(ScanHouse.NextHouse))
        $.PushCommands(
            $.Path(["go out"]),
            // $.Function(() => {
            //     App.Map.Room.ID = rid
            //     $.Next()
            // })
        )
        $.Next()
    }
    ScanHouse.Finish = () => {
        Quest.Cooldown(3600)
        App.Log("房屋盘查完毕")
        let variable = App.Mapper.Database.APIListVariables(App.Mapper.HMM.APIListOption.New().WithKeys(["houselist"]))[0]
        let lines = []
        ScanHouse.Data.Records.forEach(r => {
            lines.push(`${r.ID}|${r.Room}|${r.Type}|${r.Name}`)
        })
        variable.Value = lines.join("\n")
        App.Mapper.Database.APIInsertVariables([variable])
        App.Tools.HMM.Export()
        App.Next()
    }
    ScanHouse.DumpHouseList = () => {
        MakeHomeFolder("")
        let lines = []
        ScanHouse.Data.HouseList.forEach(h => {
            lines.push(`${h.HouseID}@${h.Room}`)
        })
        WriteHomeFile("houselist.txt", lines.join("\n"))
    }
    ScanHouse.ExportHouseList = () => {
        MakeHomeFolder("")
        let lines = []
        App.Zone.HouseList.forEach(h => {
            let zones = App.Zone.FindLocCityList(h.Room).join(",")
            lines.push(`${h.ID}|${h.Room}|${h.Name}|${h.Type}|${zones}`)
        })
        WriteHomeFile("houselist.txt", lines.join("\n"))
    }
    App.Quests.Register(Quest)
    App.Quests.ScanHouse = ScanHouse
})