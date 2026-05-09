(function (App) {
    let Breakup = {}
    Breakup.GetAction = () => {
        if (App.Data.Player.Score["任督二脉"] == false) {
            if (App.Core.GetJifaSkillLevel("force") < 450 || App.Data.Player.HP["内力上限"] < 5500 || App.Core.Player.GetSkillLevelByID("martial-cognize") < 300) {
                return ""
            }
            return "breakup"
        } else if (App.Data.Player.Score["元婴出世"] == false) {
            if (App.Data.Player.HP["精力上限"] < 2000) {
                return ""
            }
            return "animaout"
        } else if (App.Data.Player.Score["生死玄关"] == false) {
            if (App.Data.Player.HP["精力上限"] < 2000) {
                return ""
            }
            return "death"
        }
        return ""
    }
    Breakup.Go = function (action) {
        $.PushCommands(
            $.Prepare("",{NeiliMinNumber:App.Data.Player.HPM["内力上限"] * 0.91}),
            $.To("home"),
            $.Function(() => {
                if (App.Data.Player.HP["气血百分比"] <= 90) {
                    $.Insert(
                        $.Do("yun heal"),
                        $.Nobusy(),
                    )
                }
                $.Next()
            }),
            $.Function(() => {
                if (App.Data.Player.HP["精气百分比"] <= 90) {
                    $.Insert(
                        $.Do("yun inspire"),
                        $.Nobusy(),
                    )
                }
                $.Next()
            }),
            $.Function(() => {
                if (App.Data.Player.HP["当前精力"] * 100 / App.Data.Player.HP["精力上限"] <= 90) {
                    $.Insert(
                        $.Do("yun refresh"),
                        $.Nobusy(),
                    )
                }
                $.Next()
            }),
            $.Do("yun recover;yun regenerate"),
            $.Do(action),
            $.Nobusy(5000),
            $.Do("hp;score;hp -m"),
            $.Sync(),
        )
        $.Next()
    }
    const minpot = 5000
    App.Core.Quest.HeadReadyQueue.push(function () {
        if (App.PolicyParams["breakup"] == "t") {
            let action = Breakup.GetAction()
            if (action == "") {
                App.Quests.Data.MinPot = null
                return null
            }
            App.Quests.Data.MinPot = minpot
            if (App.Data.Player.HP["潜能"] < minpot) {
                return null
            }
            return function () {
                Breakup.Go(action)
            }
        }
    })
})(App)