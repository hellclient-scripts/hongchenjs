//区与模块
(function (App) {
    App.Zone = {}
    App.Zone.Maps = {}
    App.Zone.NPCDMaps = {}
    App.Zone.CiteList = [
        "洛阳",
        "北京",
        "长安",
        "开封",
        "中州",
        "苏州",
        "杭州",
        "襄阳",
        "扬州",
        "昆明",
        "荆州",
        "兰州",
        "成都",
        "福州",
        "灵州",
        "武功",
        "泉州",
        "华山",
        "佛山",
        "南海",
        "汝州",
        "嵩山",
        "凌霄",
        "五毒",
        "星宿",
        "天山",
        "关外",
        "终南",
        "大理",
        "西域",
    ];//全部区域列表，取前2字

    // App.Zone.Info = {}
    App.Zone.InfoIDMap = {}//info坐标对应的info id
    App.Zone.InfoByZone = {}//每个mud地图区域对应的info坐标列表
    App.Zone.ZonesByCity = {}//每个城市对应的zone列表，直接逃跑时用来ask
    App.Zone.LocToCityList = {}//loc对应zone的区域
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
    ])
    const NpcdMaxMove = 5
    //npcd最大移动步数
    App.Mapper.Database.APIListTraces(App.Mapper.HMM.APIListOption.New().WithGroups(["npcd"])).forEach((model) => {
        App.Zone.NPCDMaps[`${model.Key}1`] = { Rooms: App.Mapper.Database.APIDilate(model.Locations, 1, npcdcontext), Ordered: false }//计算1步路径
        App.Zone.NPCDMaps[model.Key] = { Rooms: App.Mapper.Database.APIDilate(model.Locations, NpcdMaxMove, npcdcontext), Ordered: false }//计算最大路径
        if (App.Zone.CiteList.indexOf(model.Key) > -1) {
            App.Zone.NPCDMaps[model.Key].Rooms.forEach(room => {
                if (App.Zone.LocToCityList[room] === undefined) {
                    App.Zone.LocToCityList[room] = []
                }
                App.Zone.LocToCityList[room].push(model.Key)//记录loc对应的城市
            })
        }
        let rooms = App.Mapper.Database.APIListRooms(App.Mapper.HMM.APIListOption.New().WithKeys(App.Zone.NPCDMaps[model.Key].Rooms))
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
        })
        let orderedZones = Object.keys(zones).sort((a, b) => zones[b] - zones[a])//把区域根据数量排序
        App.Zone.ZonesByCity[model.Key] = orderedZones

    });
    App.Zone.GetMap = function (name) {
        if (App.Zone.NPCDMaps[name] && App.Params.DisableNPCD.trim() != "t") {
            return App.Zone.NPCDMaps[name]
        }
        return App.Zone.Maps[name]
    }

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
    //将起点和路径传为带房间id的path
    let convertPath = function (fr, cmds) {
        return App.Map.TraceRooms(`${fr}`, ...cmds.split(";"))
    }
    let DefaultChecker = function (wanted) {
        return App.Map.Room.Data.Objects.FindByName(wanted.Target).First() || App.Map.Room.Data.Objects.FindByIDLower(wanted.Target).First()
    }
    let CheckerIDLower = function (wanted) {
        return App.Map.Room.Data.Objects.FindByIDLower(wanted.Target).First()
    }
    App.Zone.NameChecker = function (wanted) {
        let obj = App.Map.Room.Data.Objects.FindByName(wanted.Target).First()
        if (obj && obj.ID.indexOf(" ") > 0) {
            wanted.ID = obj.ID.toLowerCase()
            return obj
        }
        return null
    }
    //默认的下一步回调
    App.Zone.DefaultNext = function (map, move, wanted) {
        move.Walk(map)
    }
    //遍历目标结构
    class Wanted {
        constructor(target, zone) {
            this.Target = target
            this.Zone = zone
        }
        Target = ""//目标
        Name = ""//名字
        Zone = ""//区域
        ID = ""//ud
        Loc = null//位置
        OnFound = null//找到的回调
        SingleStep = false//是否单布
        Ordered = true//是否按顺序
        Next = App.Zone.DefaultNext//下一步的回调
        Checker = DefaultChecker//检查函数
        //链式调用
        WithID(id) {
            this.ID = id
            return this
        }
        //链式调用
        WithLoc(loc) {
            this.Loc = loc
            return this
        }
        //链式调用
        WithOnFound(found) {
            this.OnFound = found
            return this
        }
        //链式调用
        WithSingleStep(s) {
            this.SingleStep = App.Params.NumStep <= 1
            return this
        }
        //链式调用
        WithChecker(c) {
            this.Checker = c
            return this
        }
        //链式调用
        WithOrdered(o) {
            this.Ordered = o
            return this
        }
        //链式调用
        WithNext(next) {
            this.Next = next
            return this
        }
    }
    //创建新的遍历目标
    App.NewWanted = function (target, zone) {
        return new Wanted(target, zone)
    }
    //创建新的遍历目标，id部分大小写
    App.NewIDLowerWanted = function (target, zone) {
        return new Wanted(target, zone).WithChecker(CheckerIDLower)
    }
    //当前目标
    App.Zone.Wanted = null
    //注册用户队列
    App.UserQueue.UserQueue.RegisterCommand("#search", function (uq, data) {
        let result = SplitN(data, " ", 2)
        if (result.length != 2) {
            Note("#search 格式错误，应该为 #search 地区 NPC中文名")
            uq.Commands.Next()
            return
        }
        let npc = result[1]
        if (!npc) {
            npc = ""
        }
        let zone = result[0]
        let wanted = App.NewWanted(npc, zone)
        uq.Commands.Append(
            uq.Commands.NewFunctionCommand(function () { App.Zone.Search(wanted) }),
            uq.Commands.NewFunctionCommand(function () { uq.Next() }),
        )
        uq.Commands.Next()
    })
    //Finder路径初始化器
    App.Zone.Finder = function (move, map) {
        wanted = App.Zone.Wanted
        move.Option.MultipleStep = wanted.SingleStep != true
        move.OnRoom = function (move, map, step) {
            let item = wanted.Checker(wanted)
            if (item) {
                wanted.Name = item.GetData().Name
                wanted.ID = item.IDLower
                if (map.Room.ID) {
                    wanted.Loc = App.Map.Room.ID
                    Note(wanted.Target + " @ " + wanted.Loc)
                }
            }
        }
        move.OnArrive = function (move, map) {
            if (wanted.Loc) {
                App.Map.FinishMove()
                return
            }
            wanted.Next(map, move, wanted)
        }
    }
    //search区域名方法
    App.Zone.Search = function (wanted) {
        let rooms = App.Zone.GetMap(wanted.Zone)
        if (!rooms) {
            PrintSystem("#search 地图未找到")
            App.Fail()
            return
        }
        wanted.Ordered = rooms.Ordered
        App.Zone.SearchRooms(rooms.Rooms, wanted)
    }
    //search指定房间
    App.Zone.SearchRooms = function (rooms, wanted) {
        App.Zone.Wanted = wanted
        wanted.Loc = null
        let move = wanted.Ordered ? App.Move.NewOrderedCommand(rooms, App.Zone.Finder) : App.Move.NewRoomsCommand(rooms, App.Zone.Finder)
        App.Commands.PushCommands(
            move,
            App.Commands.NewFunctionCommand(() => {
                if (App.Zone.Wanted.Loc && App.Zone.Wanted.Loc != App.Map.Room.ID) {
                    App.Commands.Insert(
                        App.Move.NewToCommand(App.Zone.Wanted.Loc)
                    )
                    if (App.Zone.Wanted.OnFound) { App.Zone.Wanted.OnFound() }
                }
                App.Next()
            }),
            App.Commands.NewFunctionCommand(() => {
                if (App.Zone.Wanted.Loc && !App.Zone.Wanted.ID) {
                    App.Send("id here")
                    App.Commands.Insert(
                        App.NewSyncCommand(),
                        App.Commands.NewFunctionCommand(() => {
                            if (App.Map.Room.Data.IDHere && App.Map.Room.Data.IDHere[wanted.Target]) {
                                wanted.ID = App.Map.Room.Data.IDHere[wanted.Target].toLowerCase()
                            }
                            App.Next()
                        })
                    )
                }
                App.Next()
            })
        )
        App.Next()
    }
    //注册#killin的用户队列
    App.UserQueue.UserQueue.RegisterCommand("#killin", function (uq, data) {
        let result = SplitN(data, " ", 2)
        if (result.length != 2) {
            Note("#search 格式错误，应该为 #search 地区 NPC中文名")
            uq.Commands.Next()
            return
        }
        let npc = result[1]
        if (!npc) {
            npc = ""
        }
        let zone = result[0]
        let wanted = App.NewWanted(npc, zone)
        uq.Commands.Append(
            App.NewPrepareCommand(""),
            uq.Commands.NewFunctionCommand(function () { App.Zone.Search(wanted) }),
            uq.Commands.NewFunctionCommand(function () {
                if (npc) {
                    if (App.Zone.Wanted.Loc && App.Zone.Wanted.ID) {
                        App.Commands.Insert(
                            App.NewKillCommand(App.Zone.Wanted.ID, App.NewCombat("userqueue"))
                        )
                    }
                }
                App.Next()
            }),
            uq.Commands.NewFunctionCommand(function () { uq.Next() }),
        )
        uq.Commands.Next()
    })


})(App)