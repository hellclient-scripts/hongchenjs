(function (App) {
    App.Zone.HouseList = []//房屋列表
    App.Zone.HouseRooms = []
    App.Zone.HousePaths = []
    App.Zone.BuildPanlong = function (room, id, name) {
        // if (id == App.Mapper.HouseID) {
        //     return
        // }
        let roomid = `house-${room}-${id}`
        App.Zone.HouseRooms.push(
            App.Mapper.NewRoom(roomid, `${name}大院`, [
                App.Mapper.NewExit("out", room),
                App.Mapper.NewExit("n", `${roomid}-qt`),
            ])
        )
        App.Zone.HouseRooms.push(
            App.Mapper.NewRoom(`${roomid}-qt`, `${name}前庭`, [
                App.Mapper.NewExit("s", roomid),
                App.Mapper.NewExit("w", `${roomid}-yws`),
                App.Mapper.NewExit("e", `${roomid}-zws`),
            ])
        )
        App.Zone.HouseRooms.push(
            App.Mapper.NewRoom(`${roomid}-yws`, `${name}右卫舍`, [
                App.Mapper.NewExit("e", `${roomid}-qt`),
            ])
        )
        App.Zone.HouseRooms.push(
            App.Mapper.NewRoom(`${roomid}-zws`, `${name}左卫舍`, [
                App.Mapper.NewExit("w", `${roomid}-qt`),
            ])
        )
        let model = App.Mapper.HMM.Path.New()
        model.From = room
        model.To = roomid
        model.Command = `go ${id}`
        model.Conditions = [App.Mapper.NewCondition("streetview", 1, true)]
        App.Zone.HousePaths.push(model)

    }
    App.Zone.BuildXiaoyuan = function (room, id, name) {
        // if (id == App.Mapper.HouseID) {
        //     return
        // }
        let roomid = `house-${id}`
        App.Zone.HouseRooms.push(
            App.Mapper.NewRoom(roomid, `${name}小院`, [
                App.Mapper.NewExit("out", room),
            ])
        )
        let model = App.Mapper.HMM.Path.New()
        model.From = room
        model.To = roomid
        model.Command = `go ${id}`
        model.Conditions = [App.Mapper.NewCondition("streetview", 1, true)]
        App.Zone.HousePaths.push(model)
    }

    App.LoadLinesText(App.Mapper.Database.APIGetVariable("houselist").split("\n"), "|").forEach(data => {
        let room = {
            ID: data[0],
            Room: data[1],
            Type: data[2],
            Name: data[3],
        }
        App.Zone.HouseList.push(room)
        switch (room.Type) {
            case "盘龙":
                App.Zone.BuildPanlong(room.Room, room.ID, room.Name)
                break
            case "小院":
                App.Zone.BuildXiaoyuan(room.Room, room.ID, room.Name)
                break
        }
    })
    App.Zone.InitTag = function (map) {
        if (App.Zone.HouseRooms.length) {
            map.AddTemporaryRooms(App.Zone.HouseRooms)
        }
        if (App.Zone.HousePaths.length) {
            App.Zone.HousePaths.forEach((p) => {
                map.AddTemporaryPath(p)
            })
        }
    }
    App.Map.AppendInitiator(App.Zone.InitTag)

    // App.Zone.Info = {}
    App.Zone.InfoIDMap = {}//info坐标对应的info id
    App.Zone.InfoByZone = {}//每个mud地图区域对应的info坐标列表
    App.Zone.ZonesByCity = {}//每个城市对应的zone列表，直接逃跑时用来ask
    App.Zone.LocToCityList = {}//loc对应zone的区域
    App.Zone.LocToZone = {}//loc对应zone的区域,缓存
    App.Zone.NameToCityList = {}//房间名对应的Zone
    App.Zone.NameToLocList = {}//房间名对应的loc
    App.Zone.FindLocCityList = function (loc) {
        return App.Zone.LocToCityList[loc] || []
    }
    App.Mapper.Database.APIListRoutes(App.Mapper.HMM.APIListOption.New().WithGroups(["quest"])).forEach((model) => {
        App.Zone.Maps[model.Key] = {
            Rooms: model.Rooms,
            Ordered: true,
        }
    });
    Note("加载NPCD出生点扩展路径")
    let npcdcontext = App.Mapper.HMM.Context.New().WithRoomConditions([
        App.Mapper.HMM.ValueCondition.New("safe", 1, true)//排除安全房间
    ]).WithTags([
        App.Mapper.HMM.ValueTag.New("npcd", 1)
    ]).WithRooms(
        App.Zone.HouseRooms
    ).WithPaths(
        App.Zone.HousePaths
    )
    App.Mapper.ExpandOptions = App.Mapper.HMM.MapperOptions.New().WithCommandNotContains(["goto ", "ask ", "cross", "yell ", "jump ", "enter ", "ride "])
    let npcdoptions = App.Mapper.ExpandOptions
    const NpcdMaxMove = 5
    //npcd最大移动步数
    App.Mapper.Database.APIListTraces(App.Mapper.HMM.APIListOption.New().WithGroups(["npcd"])).forEach((model) => {
        App.Zone.NPCDMaps[`${model.Key}1`] = { Rooms: App.Mapper.Database.APIDilate(model.Locations, 1, npcdcontext, npcdoptions), Ordered: false }//计算1步路径
        App.Zone.NPCDMaps[model.Key] = { Rooms: App.Mapper.Database.APIDilate(model.Locations, NpcdMaxMove, npcdcontext, npcdoptions), Ordered: false }//计算最大路径
        if (App.Zone.CiteList.indexOf(model.Key) > -1) {
            App.Zone.NPCDMaps[model.Key].Rooms.forEach(room => {
                if (App.Zone.LocToCityList[room] === undefined) {
                    App.Zone.LocToCityList[room] = []
                }
                App.Zone.LocToCityList[room].push(model.Key)//记录loc对应的城市
            })
        }
        let rooms = App.Mapper.Database.APIListRooms(App.Mapper.HMM.APIListOption.New().WithKeys(App.Zone.NPCDMaps[model.Key].Rooms))//获取原始房间列表
        let houserooms = App.Zone.HouseRooms.filter(room => App.Zone.NPCDMaps[model.Key].Rooms.indexOf(room.Key) > -1)//追加对应的自建虚拟房间
        rooms = rooms.concat(houserooms)
        let zones = {}//当前城市对应的区域
        rooms.forEach(room => {
            if (room.Group != "") {
                if (zones[room.Group] == null) {
                    zones[room.Group] = 0
                }
                zones[room.Group]++
                if (App.Zone.InfoByZone[room.Group] === undefined) {
                    App.Zone.InfoByZone[room.Group] = []
                }
            }
            if (App.Zone.NameToCityList[room.Name] === undefined) {
                App.Zone.NameToCityList[room.Name] = []
            }
            if (App.Zone.NameToLocList[room.Name] === undefined) {
                App.Zone.NameToLocList[room.Name] = []
            }
            if (App.Zone.NameToCityList[room.Name].indexOf(model.Key) == -1) {
                App.Zone.NameToCityList[room.Name].push(model.Key)//记录房间名对应的城市
            }
            App.Zone.NameToLocList[room.Name].push(room.Key)//记录房间名对应的loc
        })
        let orderedZones = Object.keys(zones).sort((a, b) => zones[b] - zones[a])//把区域根据数量排序
        App.Zone.ZonesByCity[model.Key] = orderedZones

    });
    var loadinfodata = function () {//加载小二信息
        let infolist = App.LoadLinesText(App.Mapper.Database.APIGetVariable("infolist").split("\n"), "|")
        infolist.forEach(data => {
            App.Zone.InfoIDMap[data[0]] = data[1]
        })
        let rooms = App.Mapper.Database.APIListRooms(App.Mapper.HMM.APIListOption.New().WithKeys(infolist.map(data => data[0])))
        rooms.forEach(room => {
            if (room.Group != "") {//按NPCD代码必须所在房间有区域才能问到
                if (App.Zone.InfoByZone[room.Group] === undefined) {
                    App.Zone.InfoByZone[room.Group] = []
                }
                App.Zone.InfoByZone[room.Group].push(
                    room.Key
                )
            }
        })
    }
    loadinfodata()
})(App)