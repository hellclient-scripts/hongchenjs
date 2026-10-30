//要镖模块
$.Module(function (App) {
    let TangRou = {}
    var AllRooms = [
        "4260",
        "4262",
        "4259",
        "4263",
        "4273",
        "4264",
        "4265",
        "4266",
        "4267",
        "4256",
        "4257",
        "4255"
    ]
    TangRou.NeedSearch = false;
    TangRou.Remain = []
    TangRou.Start = () => {
        $.PushCommands(
            $.Prepare(),
            $.To("tang rou"),
            $.Ask("tang rou", "job"),
            $.Function(TangRou.Check),

        )
        App.Next()
    }
    TangRou.Check = () => {
        if (App.Data.Ask.Answers.length) {
            if (App.Data.Ask.Answers[0].Line == "唐柔说道：你去给我抓一只蚊子回来吧。") {
                TangRou.WaitSearch();
                return;
            }
            if (App.Data.Ask.Answers[0].Line == "唐柔说道：你有任务，为什么不去做？") {
                TangRou.Search();
                return;
            }
            if (App.Data.Ask.Answers[0].Line == "唐柔双拳一抱，高声说道：“恭喜！恭喜！”") {
                Quest.Cooldown(3600000)
                return;
            }
            if (App.Data.Ask.Answers[0].Line == "唐柔说道：好好，干的好，你下去歇歇吧。") {
                TangRou.Start();
                return
            }
        }
        App.Fail()
    }
    TangRou.WaitSearch = () => {
        $.PushCommands(
            $.Wait(2500),
            $.Function(TangRou.Search)
        )
        $.Next()
    }
    TangRou.Search = () => {
        TangRou.Remain = AllRooms.slice()
        TangRou.Next()
    }
    TangRou.Zhao = () => {
        TangRou.Remain = []
        App.PushCommands(
            $.To("4262"),
            $.Plan(PlanZhao),
        )
        $.Next()
    }
    TangRou.Next = () => {
        if (TangRou.Remain.length) {
            let room = TangRou.Remain.shift()
            $.PushCommands(
                $.To(room),
                $.Function(TangRou.Arrive)
            )
            $.Next()
            return
        }
        TangRou.Zhao()
    }
    TangRou.Arrive = () => {
        if (App.Map.Room.Data.Objects.FindByIDLower("boy").First() != null) {
            TangRou.Xunwen()
            return
        }
        TangRou.Next()
    }
    TangRou.Xunwen = () => {
        PlanXunwen.Execute()
    }
    let Quest = App.Quests.NewQuest("tangrou")
    let matcher1 = /^...说道：找我，你算找对了，不瞒你说吧！我刚被蚊子叮过，你说我会不会知道啊！$/
    let matcher3 = "话音刚落，一个纵身没有影了！"
    let matcher2 = /^你去.+找找啊！$/;
    let PlanXunwen = new App.Plan(
        App.Positions["Response"],
        function (task) {
            task.Data = {}
            task.Data.Mode = 0
            task.AddTrigger(matcher1, function () {
                task.Data.Mode = 1
                return true
            })
            task.AddTrigger(matcher2, function () {
                task.Data.Mode = 2
                return true
            })
            task.AddTrigger(matcher3, function () {
                if (task.Data.Mode == 1) {
                    task.Data.Mode = 3
                }
                return true
            })
            App.Send("xunwen wenzi")
            App.Sync()
        },
        function (result) {
            switch (result.Task.Data.Mode) {
                case 1:
                    TangRou.Xunwen()
                    return;
                case 2:
                    TangRou.Zhao()
                    return;
                case 3:
                    TangRou.Search()
                    return;
            }
            TangRou.Next()
        }
    )
    let matcherCalc1 = /^(\d{1,2})\*(\d{1,2})\/\((\d{1,2})\+(\d{1,2})\)=$/
    let matcherCalc2 = /^(\d{1,2})\+(\d{1,2})\/\((\d{1,2})\+(\d{1,2})\)=$/
    let matcherCalc3 = /^(\d{1,2})\*(\d{1,2})\/(\d{1,2})\+(\d{1,2})=$/
    let PlanZhao = new App.Plan(
        App.Positions["Response"],
        function (task) {
            task.AddTrigger(matcherCalc1, function (tri, result) {
                App.Send(Math.floor((result[1] - 0) * (result[2] - 0) / ((result[3] - 0) + (result[4] - 0))) + "")
            })
            task.AddTrigger(matcherCalc2, function (tri, result) {
                App.Send((result[1] - 0) + Math.floor((result[2] - 0) / ((result[3] - 0) + (result[4] - 0))) + "")
            })
            task.AddTrigger(matcherCalc3, function (tri, result) {
                App.Send((Math.floor((result[1] - 0) * (result[2] - 0) / (result[3] - 0)) + (result[4] - 0)) + "")
            })
            task.AddTimer(2000)
            App.Send("zhao wenzi")
        },
        function (result) {
            TangRou.Zhua()
        }
    )
    TangRou.Zhua = function () {
        $.Insert(
            $.Prepare(),
            $.To("4262"),
            $.Plan(PlanZhua)
        )
        $.Next()
    }
    let matcherZhua = "你眯起眼睛来，小心翼翼的靠近蚊子，猛的一扑......"
    let PlanZhua = new App.Plan(
        App.Positions["Response"],
        function (task) {
            task.Data = 0
            task.AddTrigger(matcherZhua, function (tri, result) {
                task.Data = 1
                return true;
            })
            App.Send("zhua wenzi;hp")
            App.Sync()
        },
        function (result) {
            if (result.Task.Data == 1) {
                TangRou.Zhua()
                return
            }
            TangRou.Finish()
        }
    )
    TangRou.Finish = function () {
        $.Insert(
            $.To("tang rou"),
            $.Ask("tang rou", "job"),
            $.Ask("tang rou", "眼力")
        )
        $.Next()
    }
    Quest.Name = "眼力"
    Quest.Desc = "唐门眼力任务"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.GetReady = function (q, data) {
        return () => {
            Quest.Start()
        }
    }

    Quest.Start = function () {
        TangRou.Start()
    }
    App.Quests.Register(Quest)
})