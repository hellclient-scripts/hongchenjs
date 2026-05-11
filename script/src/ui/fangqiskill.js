(function (App) {
    App.UI.FangqiSkill = {}
    App.UI.FangqiSkill.ToDo = []
    App.UI.FangqiSkill.OnAlias = (name, output, wilds) => {
        App.UI.FangqiSkill.Show(wilds["0"])
    }
    App.UI.FangqiSkill.Show = function (param) {
        if (App.InitCommad) {
            $.PushCommands(
                $.Function(App.Init),
                $.Function(App.Check),
                $.Function(() => { App.UI.FangqiSkill.Show(param) })
            )
            $.Next()
            return
        }
        let max = param.trim() - 0
        if (isNaN(max)) {
            max = 0
        }
        App.UI.FangqiSkill.ToDo = []
        var list = Userinput.newlist("请选择你要放弃的技能", "部分技能可能被保护", true)
        list.setmutli(true)
        for (var id in App.Data.Player.Skills) {
            let skill = App.Data.Player.Skills[id]
            if (!App.Quests.FangqiSkill.Protected[skill.ID] && (max <= 0 || skill["等级"] <= max)) {
                list.append(skill.ID, `${skill["名称"]}(${skill.ID}) - 等级:${skill["等级"]}`)
            }
        }
        list.publish("App.UI.FangqiSkill.ShowAction")
    }
    App.UI.FangqiSkill.ShowAction = (name, id, code, data) => {
        if (code == 0) {
            let skills = JSON.parse(data)
            App.UI.FangqiSkill.ToDo = skills
            if (App.UI.FangqiSkill.ToDo.length > 0) {
                App.UI.Wizard.ShowConfirm()
            }
        }
    }
    App.UI.Wizard.ShowConfirm = function () {
        Userinput.prompt("App.UI.Wizard.OnConfirm", "放弃技能", `${App.UI.FangqiSkill.ToDo.join(",")}\n请在下方输入您要放弃的这些技能表示确认`, "")
    }
    App.UI.Wizard.OnConfirm = function (name, id, code, data) {
        if (code == 0 && data == App.UI.FangqiSkill.ToDo.join(",")) {
            var list = Userinput.newlist("最后确定", `您确定要放弃下列技能吗？\n\n${App.UI.FangqiSkill.ToDo.join(",")}`, false)
            list.append("fangqi", "确定放弃")
            list.append("cancel", "取消")
            list.publish("App.UI.Wizard.OnFinalConfirm")
        }
    }
    App.UI.Wizard.OnFinalConfirm = function (name, id, code, data) {
        if (code == 0 && data == "fangqi") {
            App.Core.Quest.Exec(`fangqiskill ${JSON.stringify({ "SkillsToFangqi": App.UI.FangqiSkill.ToDo })}\nstop`)
        }
    }
})(App)