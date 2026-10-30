//设置精灵
(function (App) {
    App.UI.Wizard = {}
    App.UI.Wizard.ForcesCanSuck = { "吸星大法": true, "北冥神功": true }
    App.UI.Wizard.PerformType = function (cmd) {
        let throwing = App.Data.Player.Jifa["throwing"]
        if (throwing && throwing.Skill == "金钱镖法") {
            return "金钱镖法"
        }
        if (throwing && throwing.Skill == "唐门暗器") {
            return "唐门暗器"
        }
        return ""
    }
    App.UI.Wizard.MakeCombat = function (cmd) {
        var result = [`#before yun regenerate;yun recover`]
        var pfm = App.UI.Wizard.PerformType(cmd)
        switch (pfm) {
            case "金钱镖法":
                result.push(`#start $wpon;hand coin;${cmd}`, `hand coin;${cmd}`)
                break
            case "唐门暗器":
                result.push(`#start $wpon;hand tie lianzi;hand qizi gangbiao;${cmd};get qizi gangbiao `, `hand tie lianzi;hand qizi gangbiao;${cmd};get qizi gangbiao`)
                break
            default:
                result.push(`#start $wpon;${cmd}`, `${cmd}`)
                break
        }
        return result
    }
    App.UI.Wizard.PrepareItems = function (cmd) {
        var pfm = App.UI.Wizard.PerformType(cmd)
        switch (pfm) {
            case "金钱镖法":
                App.UI.Wizard.InsertToVariable("items", "coin * 50")
                break
            case "唐门暗器":
                App.UI.Wizard.InsertToVariable("items", "tie lianzi1000 * 2000")
                break
        }
    }
    App.UI.Wizard.InsertToVariable = function (name, line) {
        let v = GetVariable(name).split("\n")
        if (v.indexOf(line) < 0) {
            SetVariable(name, GetVariable(name) + (v.length ? "\n" : "") + line)
        }
    }
    App.UI.Wizard.JifaData = ""
    App.UI.Wizard.WieldCmd = ""
    App.UI.Wizard.WieldID = ""
    App.UI.Wizard.NeedLongSword = false
    App.UI.Wizard.WieldCmd2 = ""
    App.UI.Wizard.WieldID2 = ""
    App.UI.Wizard.Shot = false
    App.UI.Wizard.YunSuck = false
    App.UI.Wizard.CommandsData = ""
    App.UI.Wizard.Check = function () {
        if (!GetVariable("id")) {
            return "id"
        }
        if (!GetVariable("password")) {
            return "password"
        }
        if (!GetVariable("jifa")) {
            return "jifa"
        }
        if (!GetVariable("weapon")) {
            return "weapon"
        }
        if (!GetVariable("combat")) {
            return "combat"
        }
        if (!GetVariable("command")) {
            return "command"
        }
        return ""
    }
    App.UI.Wizard.Next = function () {
        if (App.InitCommad) {
            $.PushCommands(
                $.Function(App.Init),
                $.Function(App.Check),
                $.Sync(),
                $.Function(App.UI.Wizard.Next)
            )
            $.Next()
            return
        }
        App.ReloadVariable()
        switch (App.UI.Wizard.Check()) {
            case "id":
                App.UI.Wizard.ShowID()
                break
            case "password":
                App.UI.Wizard.ShowPassword()
                break
            case "jifa":
                App.UI.Wizard.ShowJifa()
                break
            case "weapon":
                App.UI.Wizard.ShowWield()
                break
            case "combat":
                App.UI.Wizard.ShowCombat()
                break
            case "command":
                App.UI.Wizard.PrepareCommand()
                break
            default:
                App.UI.Wizard.ShowFinish()
                break
        }
    }
    App.UI.Wizard.ShowID = function () {
        Userinput.prompt("App.UI.Wizard.OnID", "请设置你的ID", "你游戏的登陆id", App.Data.Player.Score.ID)
    }
    App.UI.Wizard.OnID = function (name, id, code, data) {
        if (code == 0) {
            SetVariable("id", data)
            App.UI.Wizard.Next()
        }
    }
    App.UI.Wizard.ShowPassword = function () {
        Userinput.prompt("App.UI.Wizard.OnPassword", "请设置你的密码", "你游戏的登陆密码", "")
    }
    App.UI.Wizard.OnPassword = function (name, id, code, data) {
        if (code == 0) {
            SetVariable("password", data)
            App.UI.Wizard.Next()
        }
    }
    App.UI.Wizard.ShowJifa = function () {
        let jifaskills = App.Core.GetJifaSkills()
        let beiskills = App.Core.GetBeiSkills()
        let data = []
        jifaskills.forEach(item => {
            data.push(`jifa ${item[0]} ${item[1]}`)
        })
        if (beiskills.length > 0 || data.length == 0) {
            data.push(`bei ${beiskills.join(" ")}`)
        }
        App.UI.Wizard.JifaData = data.join("\n")
        Userinput.confirm("App.UI.Wizard.OnJifa", "请设置你激发的技能", "推测你的激发的技能如下:\n\n" + App.UI.Wizard.JifaData)
    }
    App.UI.Wizard.OnJifa = function (name, id, code, data) {
        if (code == 0) {
            SetVariable("jifa", App.UI.Wizard.JifaData)
            App.UI.Wizard.Next()
        }
    }
    App.UI.Wizard.ShowWield = function () {
        Userinput.prompt("App.UI.Wizard.OnWield", "装备指令", "请设置你装备武器的指令。如：\nwield long sword\nwear mystrike", "")
    }
    App.UI.Wizard.OnWield = function (name, id, code, data) {
        if (code == 0) {
            App.UI.Wizard.NeedLongSword = false
            if (data.startsWith("wield ")) {
                App.UI.Wizard.WieldCmd = "#wield"
                App.UI.Wizard.WieldID = data.slice(6).trim()
                if (App.UI.Wizard.WieldID == "long sword") {
                    App.UI.Wizard.NeedLongSword = true
                }
                App.UI.Wizard.ShowWield2()
                return
            } else if (data.startsWith("wear ")) {
                App.UI.Wizard.WieldCmd = "#wear"
                App.UI.Wizard.WieldID = data.slice(5).trim()
                App.UI.Wizard.ShowLongsword()
                return
            }
            App.UI.Wizard.ShowWield()
        }
    }
    App.UI.Wizard.ShowLongsword = function () {
        var list = Userinput.newlist("准备长剑", "检查到您使用了空手武器，是否需要准备一把长剑，进入特殊房间，比如保护任务找杨过龙女", true)
        list.append("yes", "准备长剑")
        list.append("no", "不需要长剑")
        list.publish("App.UI.Wizard.OnLongsword")
    }
    App.UI.Wizard.OnLongsword = function (name, id, code, data) {
        if (code == 0) {
            App.UI.Wizard.NeedLongSword = (data == "yes")
            App.UI.Wizard.ShowWield2()
        }
    }
    App.UI.Wizard.ShowTouch = function () {
        Userinput.prompt("App.UI.Wizard.OnTouch", "Touch武器", "请设置你需要Touch会内力的10兵，留空不touch", "")

    }
    App.UI.Wizard.NeedRepair = {
        "zhang jin": true
    }
    App.UI.Wizard.OnTouch = function (name, id, code, data) {
        if (code == 0) {
            let touch = data.trim()
            let weapon = [`${App.UI.Wizard.WieldCmd} ${App.UI.Wizard.WieldID}`]
            if (App.UI.Wizard.NeedLongSword) {
                App.UI.Wizard.InsertToVariable("items", "long sword")
                weapon.push("#wield.sword long sword")
                weapon.push("#repair long sword * 1")
            }
            if (App.UI.Wizard.WieldID.indexOf(" ") < 0 || App.UI.Wizard.NeedRepair[App.UI.Wizard.WieldID]) {
                weapon.push(`#repair ${App.UI.Wizard.WieldID} * 50`)
            }
            if (App.UI.Wizard.WieldID2) {
                weapon.push(`${App.UI.Wizard.WieldCmd2} ${App.UI.Wizard.WieldID2}`)
                weapon.push(`#repair ${App.UI.Wizard.WieldID2} * 50`)
            }
            if (touch) {
                weapon.push("#touch " + touch)
            } else {
                App.UI.Wizard.InsertToVariable("items", "sleepbag")
            }
            SetVariable("weapon", weapon.join("\n"))
            App.UI.Wizard.Next()
        }
    }
    App.UI.Wizard.ShowWield2 = function () {
        Userinput.prompt("App.UI.Wizard.OnWield2", "磨兵器指令", "请设置你是否需要磨兵器，留空不磨兵器。如：\nwear mystrike", "")
    }
    App.UI.Wizard.OnWield2 = function (name, id, code, data) {
        if (code == 0) {
            if (data.trim() == "") {
                App.UI.Wizard.ShowTouch()
                return
            } else if (data.startsWith("wield ")) {
                App.UI.Wizard.WieldCmd2 = "#wield"
                App.UI.Wizard.WieldID2 = data.slice(6).trim()

                App.UI.Wizard.ShowTouch()
                return
            } else if (data.startsWith("wear ")) {
                App.UI.Wizard.WieldCmd2 = "#wear"
                App.UI.Wizard.WieldID2 = data.slice(5).trim()
                App.UI.Wizard.ShowTouch()
                return
            }
            App.UI.Wizard.ShowWield2()
        }
    }

    App.UI.Wizard.ShowCombat = function () {
        Userinput.prompt("App.UI.Wizard.OnCombat", "战斗设置", "请设置您的战斗指令，射箭ID请填shot,如:\nperform unarmed.xue twice\nshot", "")
    }
    App.UI.Wizard.OnCombat = function (name, id, code, data) {
        if (code == 0) {
            data = data.trim()
            if (data == "") {
                App.UI.Wizard.ShowCombat()
                return
            }
            if (data == "shot") {
                App.UI.Wizard.InsertToVariable("items", "long bow")
                App.UI.Wizard.InsertToVariable("items", "arrow * 30")
                SetVariable("combat", ["#before yun regenerate;yun recover", "#start $wpon;hand bow;shot $1 with arrow", "shot $1 with arrow"].join("\n"))
            } else {
                App.UI.Wizard.PrepareItems(data)
                SetVariable("combat", App.UI.Wizard.MakeCombat(data).join("\n"))
            }
            App.UI.Wizard.Next()
        }
    }
    App.UI.Wizard.PrepareCommand = function () {
        App.UI.Wizard.YunSuck = false
        let force = App.Data.Player.Jifa["force"]
        if (force && App.UI.Wizard.ForcesCanSuck[force.Skill]) {
            App.UI.Wizard.ConfirmYunSuck();
            return
        }
        App.UI.Wizard.ShowCommand()
    }
    App.UI.Wizard.ConfirmYunSuck = function () {
        Userinput.confirm("App.UI.Wizard.OnConfirmYunSuck", "确认yun suck", "您确定要使用yun suck吗？")
    }

    App.UI.Wizard.OnConfirmYunSuck = function (name, id, code, data) {
        if (code == 0) {
            App.UI.Wizard.YunSuck = true
        } else {
            App.UI.Wizard.YunSuck = false
        }
        App.UI.Wizard.ShowCommand()
    }
    App.UI.Wizard.ShowCommand = function () {
        let commands = []
        var wponcmd = App.UI.Wizard.WieldCmd2 ? "#prepare #wpoff 2;#wpon" : ""
        var changewpcmd = App.UI.Wizard.WieldCmd2 ? "#npcfaint #wpoff;#wpon 2" : ""
        var wpoff2cmd = App.UI.Wizard.WieldCmd2 ? "#npcdie  #wpoff 2" : ""
        var yunsuckcmd = App.UI.Wizard.YunSuck ? "#npcfaint yun suck" : ""
        var yunsuckcmd2 = App.UI.Wizard.YunSuck ? "#npcfinish yun suck" : ""
        var pfm = App.UI.Wizard.PerformType()
        var getbiaocmd1 = pfm == "唐门暗器" ? "#npcfaint #enemy get qizi gangbiao from $1" : ""
        var getbiaocmd2 = pfm == "唐门暗器" ? "#combatdie get qizi gangbiao from corpse" : ""
        var getbiaocmd3 = pfm == "唐门暗器" ? "#combatstop get qizi gangbiao from corpse" : ""



        if (GetVariable("combat").indexOf("with arrow") >= 0) {
            commands = [
                "#prepare ",
                "#wait jiqu",
                getbiaocmd1,
                getbiaocmd2,
                getbiaocmd3,
            ]
        } else if (App.Core.Weapon.Touch) {
            commands = [
                "#prepare yun powerup;yun shield",
                wponcmd,
                "#wait #yanjiulian;#jiqu",
                "#mqbefore #yanjiulian",
                getbiaocmd1,
                changewpcmd,
                yunsuckcmd,
                yunsuckcmd2,
                wpoff2cmd,
                "#npcdie #yanjiulian",
                "#moveyanjiu #yanjiu",
                "#pause #yanjiulian",
                getbiaocmd2,
                getbiaocmd3,
            ]
        } else {
            commands = [
                "#prepare yun powerup;yun shield",
                wponcmd,
                getbiaocmd1,
                changewpcmd,
                yunsuckcmd,
                yunsuckcmd2,
                wpoff2cmd,
                "#wait #jiqu",
                getbiaocmd2,
                getbiaocmd3,

            ]
        }
        App.UI.Wizard.CommandsData = commands.filter(cmd => cmd.trim() !== "").join("\n")
        Userinput.confirm("App.UI.Wizard.OnCommand", "设置您的自定义指令", "根据你的战斗设置，推测你的指令如下:\n\n" + App.UI.Wizard.CommandsData)
    }
    App.UI.Wizard.OnCommand = function (name, id, code, data) {
        if (code == 0) {
            SetVariable("command", App.UI.Wizard.CommandsData)
            App.UI.Wizard.Next()
        }
    }
    App.UI.Wizard.ShowFinish = function () {
        let data = [
            "复杂变量已经设置完成了",
            "接下来您需要做如下设置",
            "1.设置house变量和dummy_hosue变量,您的房间信息",
            "2.设置max_pot变量和study变量,您的学习设置",
            "3.设置quest变量,您机器的主要任务",
            "4.调用助理的`初始化练习清单`，设置您需要练习的技能",
            "",
            "全部修改完后记得要保存游戏，否则下次打开后设置都会丢失！！！",
            "全部修改完后记得要保存游戏，否则下次打开后设置都会丢失！！！",
            "全部修改完后记得要保存游戏，否则下次打开后设置都会丢失！！！",

        ]
        Userinput.confirm("", "设置完成", data.join("\n"))
    }
    App.UI.Wizard.ConfirmReset = function () {
        Userinput.confirm("App.UI.Wizard.OnConfirmReset", "确认重置向导", "您确定要重置向导吗？所有设置将会被清空。")
    }
    App.UI.Wizard.OnConfirmReset = function (name, id, code, data) {
        if (code == 0) {
            App.UI.Wizard.Reset()
        }
    }
    App.UI.Wizard.Reset = function () {
        var changed = false
        if (GetVariable("jifa")) {
            SetVariableComment("jifa", GetVariable("jifa"))
            SetVariable("jifa", "")
            changed = true
        }
        if (GetVariable("weapon")) {
            SetVariableComment("weapon", GetVariable("weapon"))
            SetVariable("weapon", "")
            changed = true
        }
        if (GetVariable("combat")) {
            SetVariableComment("combat", GetVariable("combat"))
            SetVariable("combat", "")
            changed = true
        }
        if (GetVariable("command")) {
            SetVariableComment("command", GetVariable("command"))
            SetVariable("command", "")
            changed = true
        }
        Note("向导已重置")
        if (changed) {
            Note("原设置已经备份到变量备注内")
        }
    }
})(App)