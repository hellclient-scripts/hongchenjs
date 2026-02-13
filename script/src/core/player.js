//用户信息模块
(function (App) {
    App.Core.Player = {}
    App.Core.Player.BasicSkills = {}
    App.Core.Player.KnowledgeSkills = {}
    Note("加载门派信息 /data/familylist.txt")
    App.Core.Player.FamilyList = App.LoadLines("data/familylist.txt", ",")
    App.Data.Player = {
        NoForce: true,
        HP: {},
        HPM: {},
        Special: {},
        Score: {},
        Skills: {},
        Jifa: {},
    }
    Note("加载基本技能 /data/skills/base.txt")
    App.LoadLines("data/skills/base.txt", ",").forEach(data => {
        switch (data[1]) {
            case "0":
                App.Core.Player.BasicSkills[data[0]] = "知识"
                break
            case "1":
                App.Core.Player.BasicSkills[data[0]] = "其他武学"
                break
            case "2":
                App.Core.Player.BasicSkills[data[0]] = "兵器武学"
                break
            case "3":
                App.Core.Player.BasicSkills[data[0]] = "空手武学"
                break
            case "4":
                App.Core.Player.BasicSkills[data[0]] = "音乐"
                break;
        }
    })
    Note("加载知识技能 /data/skills/knowledge.txt")
    App.LoadLines("data/skills/knowledge.txt", ",").forEach(data => {
        App.Core.Player.KnowledgeSkills[data[0]] = data[1]
    })
    //HP的checker
    let checkerHP = App.Checker.Register("hp", "yun recover;yun regenerate;hp", 5000)
    //≡───────────────────────────────≡
    //【 精 气 】 91935/ 91936 ( 99%)    【 精 力 】 12795 / 12795 (+0)
    //【 气 血 】 132994/ 134802 ( 99%)    【 内 力 】 66275 / 60275 (+3538)
    //【 食 物 】   907/   970           【 潜 能 】  2442
    //【 饮 水 】   873/   970           【 体 会 】  1215
    //【 平 和 】  ─────────    【 经 验 】  4733814117
    //≡──────────────────────────ZHYX───≡

    var matcherHPLine1 = /^【 精 气 】\s*(-?\d+)\s*\/\s+(-?\d+)\s*\(\s*(-?\d+)%\)\s+【 精 力 】\s+(-?\d+)\s+\/\s*(-?\d+)\s+\(\+\s*(\d+)\)\s*$/
    var matcherHPLine2 = /^【 气 血 】\s*(-?\d+)\s*\/\s+(-?\d+)\s*\(\s*(-?\d+)%\)\s+【 内 力 】\s+(-?\d+)\s+\/\s*(-?\d+)\s+\(\+\s*(\d+)\)\s*$/
    var matcherHPLine3 = /^【 食 物 】\s*(-?\d+)\s*\/\s+(-?\d+)\s*【 潜 能 】\s+(-?\d+)\s*$/
    var matcherHPLine4 = /^【 饮 水 】\s*(-?\d+)\s*\/\s+(-?\d+)\s*【 体 会 】\s+(-?\d+)\s*$/
    var matcherHPLine5 = /^【 .+【 经 验 】\s+(-?\d+)\s*$/
    var matcherHPEnd = /^≡─+[^─]+─+─≡$/
    //响应hp指令的计划
    var PlanOnHP = new App.Plan(App.Positions.Connect,
        function (task) {
            task.AddTrigger(matcherHPLine1, function (trigger, result, event) {
                App.Data.Player.HP["当前精气"] = result[1] - 0
                App.Data.Player.HP["精气上限"] = result[2] - 0
                App.Data.Player.HP["精气百分比"] = result[3] - 0
                App.Data.Player.HP["当前精力"] = result[4] - 0
                App.Data.Player.HP["精力上限"] = result[5] - 0
                App.Data.Player.HP["加精"] = result[6] - 0
                return true
            })
            task.AddTrigger(matcherHPLine2, function (trigger, result, event) {
                App.Data.Player.HP["当前气血"] = result[1] - 0
                App.Data.Player.HP["气血上限"] = result[2] - 0
                App.Data.Player.HP["气血百分比"] = result[3] - 0
                App.Data.Player.HP["当前内力"] = result[4] - 0
                App.Data.Player.HP["内力上限"] = result[5] - 0
                App.Data.Player.HP["加力"] = result[6] - 0
                return true
            })
            task.AddTrigger(matcherHPLine3, function (trigger, result, event) {
                App.Data.Player.HP["当前食物"] = result[1] - 0
                App.Data.Player.HP["最大食物"] = result[2] - 0
                if (App.Data.Player.HP["当前食物"] < App.Data.Player.HP["最大食物"]) {
                    App.NeedEat = true
                }
                App.Data.Player.HP["潜能"] = result[3] - 0
                return true
            })
            task.AddTrigger(matcherHPLine4, function (trigger, result, event) {
                App.Data.Player.HP["当前饮水"] = result[1] - 0
                App.Data.Player.HP["最大饮水"] = result[2] - 0
                if (App.Data.Player.HP["当前饮水"] < App.Data.Player.HP["最大饮水"]) {
                    App.NeedEat = true
                }
                App.Data.Player.HP["体会"] = result[3] - 0
                return true
            })
            task.AddTrigger(matcherHPLine5, function (trigger, result, event) {
                App.Data.Player.HP["经验"] = result[1] - 0
                return true
            })
            task.AddTimer(5000)
            task.AddTrigger(matcherHPEnd)
        },
        function (result) {
            checkerHP.Reset()
        })
    App.Core.OnHP = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.HP = {}
            PlanOnHP.Execute()
        })
    }
    App.BindEvent("core.hp", App.Core.OnHP)


    //吃yuchi zhou 逻辑
    let LastEat = 0
    let IntervalEat = 2000
    App.NeedEat = false
    App.Eat = function (force) {
        if (App.NeedEat) {
            let now = (new Date()).getTime()
            if (force || (now - LastEat > IntervalEat)) {
                App.Send(App.Params.FoodCommand)
                if (App.Params.FoodCommand != App.Params.DrinkCommand) {
                    App.Send(App.Params.DrinkCommand)
                }
                LastEat = now
            }
        }
    }
    App.BindEvent("core.beforecheck", function (event) {
        App.Eat()
    })
    App.BindEvent("core.foodfull", () => {
        App.NeedEat = false
        checkerHP.Force()
    })
    App.BindEvent("core.foodempty", () => {
        App.NeedEat = true
        checkerHP.Force()
    })
    App.BindEvent("core.hungry", () => {
        App.NeedEat = true
    })
    // 你现在会以下这些特技：
    // 杀气(hatred)
    // 小周天运转(self)
    matcherSpecial = /^\S+\(([a-z]+)\)$/
    //响应special指令的计划
    var PlanOnSpecial = new App.Plan(App.Positions.Connect,
        function (task) {
            task.AddTrigger(matcherSpecial, function (trigger, result, event) {
                App.Data.Player.Special[result[1]] = true
                event.Context.Set("core.player.onspecial", true)
                return true
            })
            task.AddCatcher("line", function (catcher, event) {
                return event.Context.Get("core.player.onspecial")
            })
            task.AddTimer(5000)
        },
        function (result) {
        })
    App.Core.OnSpecial = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.Special = {}
            PlanOnSpecial.Execute()
        })
    }
    App.BindEvent("core.special", App.Core.OnSpecial)
    var LastID = ""
    var LastName = ""
    App.Core.OnTitle = function (event) {
        LastName = event.Data.Wildcards[0]
        LastID = event.Data.Wildcards[1].toLowerCase()
    }
    App.BindEvent("core.title", App.Core.OnTitle)
    App.Core.OnScore = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.Score = {}
            App.Data.Player.Score["名字"] = LastName
            App.Data.Player.Score.ID = LastID
            PlanOnScore.Execute()
        })

    }
    //score的checker
    let checkerScore = App.Checker.Register("score", "score", 600000)

    //你的状态属性如下：
    //≡──────────────────────────≡
    // 【武林神话】华山派第十四代传人 渡劫(imez)
    //--------------------------------------------------------
    //  你是位一百五十四岁二个月的男性，甲午年十一月九日酉时三刻生。
    //  膂力：[448]  悟性：[148]  根骨：[452]  身法：[411]
    //  你是福建人氏，天性狡黠多变，师父是岳不群。
    //  你目前的存款：二十九万四千一百五十九两黄金六十二两白银五文铜钱。
    //  你尚未娶妻。
    //  你还是童男。
    //--------------------------------------------------------
    //  战斗攻击： 29371702		  战斗防御： 30468583
    //  战斗伤害：        0		  战斗保护：        8
    //--------------------------------------------------------
    //  你到目前为止总共杀生二百八十一万八千零九十一次。
    //  你到目前为止总共到黑白无常那里串门二百五十三次。
    //  你最后一次是被李朱刺死了。
    //--------------------------------------------------------
    //  任督二脉：   ○                 元婴出世：   ○
    //  生死玄关：   ○                 转世重生：   ○
    //  主角光环：   × (三次转世)
    //--------------------------------------------------------
    //前四穴： 肩前穴：○  天冲穴：○  天池穴：○  髀关穴：○ 
    //后四穴： 天突穴：×  涌泉穴：○  气海穴：○  曲池穴：○ 
    //--------------------------------------------------------
    //  镇狱惊天丸： ×                 子午龙甲丹： ×
    //  玄黄紫箐丹： ×                   转世脱离： ○
    //--------------------------------------------------------
    //  拳脚功夫：  无评价              兵器运用：  无评价
    //  内家功夫：  无评价              轻身功夫：  无评价
    //--------------------------------------------------------
    //  实战经验： 4733814117		  门派贡献： 165245116
    //  江湖阅历： 732355152		  江湖威望： 101269096
    //  正    气： 10512865490		  灵    慧：   281358
    //  转生次数： 	五		  转生灵魂： 	16022		
    //≡──────────────────────ZHYX──≡

    App.BindEvent("core.score", App.Core.OnScore)
    var matcherScoreEnd = /^≡─+[^─]+─+─≡$/
    var matcherScoreMe = /^ 【(.+)】([^「」]+)(「(.+)」)?\s+(\S+)\((.+?)\)$/
    var matcherScoreGender = /^  你是.+([男|女])性，.+年.+生。$/
    var matcherScoreBank = /^  你目前的存款：(.+)两黄金.+。$/
    var matcherScoreExp = /^  实战经验：\s+(\d+)\s+门派贡献：\s+(\d+)$/
    var matcherScoreYueli = /^  江湖阅历：\s+(\d+)\s+江湖威望：\s+(\d+)$/
    var matcherScoreZhengqi = /^  (正|邪)\s+气：\s+(\d+)\s+灵\s+慧：\s*(\d+)\s*$/
    //响应score指令的计划
    var PlanOnScore = new App.Plan(App.Positions.Connect,
        function (task) {
            App.Data.Player.Score = {
                "存款": 0,
            }
            task.AddTrigger(matcherScoreMe, function (trigger, result, event) {
                for (var item of App.Core.Player.FamilyList) {
                    if (result[2].startsWith(item[1])) {
                        App.Data.Player.Score["Family"] = item[0]
                        App.Data.Player.Score["门派"] = item[1]
                        App.Data.Player.Score["级别"] = result[2].slice(item[1].length).trim()
                        App.Data.Player.Score["掌门"]=item[2]
                    }
                }
                if (!App.Data.Player.Score["Family"]) {
                    throw new Error(`无法识别的门派: ${result[2]}`)
                }
                App.Data.Player.Score["称号"] = result[1]
                App.Data.Player.Score["昵称"] = result[4] || ""
                App.Data.Player.Score["名字"] = result[5]
                App.Data.Player.Score["ID"] = result[6]
                return true
            })
            task.AddTrigger(matcherScoreGender, function (trigger, result, event) {
                App.Data.Player.Score["性别"] = result[1]
                return true
            })
            task.AddTrigger(matcherScoreBank, function (trigger, result, event) {
                App.Data.Player.Score["存款"] = App.CNumber.ParseNumber(result[1])
                return true
            })
            task.AddTrigger(matcherScoreExp, function (trigger, result, event) {
                App.Data.Player.Score["实战经验"] = result[1] - 0
                App.Data.Player.Score["门派贡献"] = result[2] - 0
                return true
            })
            task.AddTrigger(matcherScoreYueli, function (trigger, result, event) {
                App.Data.Player.Score["江湖阅历"] = result[1] - 0
                App.Data.Player.Score["江湖威望"] = result[2] - 0
                return true
            })
            task.AddTrigger(matcherScoreZhengqi, function (trigger, result, event) {
                App.Data.Player.Score["正气"] = result[2] - 0
                if (result[1] != "正") {
                    App.Data.Player.Score["正气"] = -App.Data.Player.Score["正气"]
                }
                App.Data.Player.Score["灵慧"] = result[3] - 0
                return true
            })
            task.AddTimer(5000)
            task.AddTrigger(matcherScoreEnd)
        },
        function (result) {
            checkerScore.Reset()
        })



    var LastBasic = ""//skills的最后一个基本(当前基本)
    App.Core.OnSkills = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.Skills = {}
            LastBasic = ""
            PlanOnSkills.Execute()
        })
    }
    //计算最大等级
    App.Core.GetMaxSkillLevel = function () {
        let max = 0
        let maxskill = null
        for (var key in App.Data.Player.Skills) {
            let skill = App.Data.Player.Skills[key]
            if (skill["受限经验"]) {
                if (skill["等级"] > max) {
                    max = skill["等级"]
                    maxskill = skill
                }
            }
        }
        return maxskill
    }
    //skills的checker
    let checkerSkills = App.Checker.Register("skills", "cha", 300000)
    App.BindEvent("core.skills", App.Core.OnSkills)
    // 你目前所学到的所有技能
    //≡──────────────────────────≡
    //  基本内功 (force)                         - 3618/  0%
    //  少林心法 (shaolin-xinfa)                 -  409/ 47%
    //  战神心经 (zhanshen-xinjing)              -  380/ 30%
    //  辟邪剑法 (pixie-jian)                    -  340/ 16%
    //  罗汉伏魔神功 (luohan-fumogong)           -  347/  2%
    //  华山心法 (huashan-xinfa)                 -  275/  5%
    //□浑天宝鉴 (huntian-baojian)               - 2464/ 16%
    //  易筋锻骨 (yijin-duangu)                  -  397/ 25%
    //  易筋经神功 (yijinjing)                   -  638/  6%
    //  神照经神功 (shenzhaojing)                -  418/ 32%
    //  混元一气功 (hunyuan-yiqi)                -  411/ 12%
    //  基本轻功 (dodge)                         - 3192/ 80%
    //  蛇行狸翻 (shexing-lifan)                 - 2064/  4%
    //  如影随行腿 (ruying-suixingtui)           - 1047/  0%
    //  神行百变 (shenxing-baibian)              - 1836/ 39%
    //  庄 子 舞 (zhuangzi-wu)                   - 1058/  0%
    //  少林弹腿 (shaolin-tantui)                - 1059/  0%
    //  旋风扫叶腿 (xuanfeng-tui)                - 2587/ 55%
    //  一苇渡江 (yiwei-dujiang)                 - 1056/  0%
    //  华山身法 (huashan-shenfa)                - 1049/  0%
    //  少林身法 (shaolin-shenfa)                - 1058/  0%
    //  基本拳法 (cuff)                          -  518/ 26%
    //  劈石破玉拳 (poyu-quan)                   - 2100/  0%
    //  罗 汉 拳 (luohan-quan)                   -  513/ 37%
    //□大金刚拳 (jingang-quan)                  -  292/100%
    //  醉拳三打 (zuiquan-sanda)                 - 1062/  0%
    //  伏 虎 拳 (fuhu-quan)                     -  278/  1%
    //  基本掌法 (strike)                        -  403/ 10%
    //  般 若 掌 (banruo-zhang)                  -  293/  0%
    //  混 元 掌 (hunyuan-zhang)                 - 2833/ 60%
    //  散 花 掌 (sanhua-zhang)                  -  283/ 42%
    //  一拍两散 (yipai-liangsan)                -  235/  1%
    //  握 石 掌 (woshi-zhang)                   -  296/  0%
    //  千手如来掌 (rulai-zhang)                 -  274/  0%
    //  基本指法 (finger)                        -  595/ 14%
    //  六脉神剑 (six-finger)                    -  307/ 37%
    //  无相指法 (wuxiang-zhi)                   -  444/  0%
    //  梅花三洞指 (sandong-finger)              -  419/ 62%
    //  金 刚 指 (jingang-zhi)                   -  383/ 26%
    //  拈 花 指 (nianhua-zhi)                   -  309/  0%
    //  一 指 禅 (yizhi-chan)                    -  594/ 28%
    //□六脉神剑 (liumai-shenjian)               -  590/ 68%
    //  夺 命 指 (duoming-finger)                -  290/  2%
    //  无 名 指 (wuming-finger)                 -  362/  2%
    //  去烦恼指 (qufannao-zhi)                  -  311/  4%
    //  基本爪法 (claw)                          -  421/ 12%
    //  寂 灭 爪 (jimie-zhua)                    -  298/  0%
    //  龙 爪 功 (longzhua-gong)                 -  284/  0%
    //  因陀罗爪 (yingtuo-luozhua)               -  300/  1%
    //□九阴白骨爪 (jiuyin-baiguzhao)            -  269/  5%
    //  鹰 爪 功 (yingzhua-gong)                 -  277/  1%
    //  基本剑法 (sword)                         -  417/ 15%
    //  辟邪剑法 (pixie-sword)                   -  311/  0%
    //  清凉剑法 (qingliang-jian)                -  285/  1%
    //  伏 魔 剑 (fumo-jian)                     -  289/  0%
    //  龙形剑法 (longxing-jian)                 -  285/  1%
    //  苏秦背剑 (suqin-beijian)                 -  276/  1%
    //  罗汉剑法 (luohan-jian)                   -  290/  0%
    //  迅雷剑法 (xunlei-jian)                   -  282/  1%
    //  华山剑法 (huashan-jian)                  -  259/  4%
    //  达 摩 剑 (damo-jian)                     -  285/  0%
    //  基本刀法 (blade)                         -  411/ 45%
    //  燃木刀法 (ranmu-daofa)                   -  295/  0%
    //  修 罗 刀 (xiuluo-dao)                    -  310/  0%
    //  戒尘刀法 (jiechen-dao)                   -  291/  1%
    //  慈 悲 刀 (cibei-dao)                     -  277/  1%
    //  红叶刀法 (hongye-daofa)                  -  279/  1%
    //  基本拳脚 (unarmed)                       - 3605/ 51%
    //  钻石星辰拳 (xingchen-unarmed)            - 1052/  0%
    //  袈裟伏魔功 (jiasha-fumogong)             - 1056/  0%
    //  十二路潭腿 (tan-tui)                     - 1058/  0%
    //  破 衲 功 (pona-gong)                     - 1058/  0%
    //  擒拿十八打 (qinna-shibada)               - 1068/  0%
    //  大伏魔拳 (dafumo-quan)                   - 1057/  0%
    //  云海波涛拳 (botao-unarmed)               - 1918/ 78%
    //  基本招架 (parry)                         - 3401/  4%
    //  金刚不坏体 (jingang-buhuaiti)            - 1056/  0%
    //  乾坤大挪移 (qiankun-danuoyi)             -  278/ 27%
    //  基本医术 (medical)                       -  254/ 12%
    //  吹箫技法 (chuixiao-jifa)                 -  446/  0%
    //  弹琴技法 (tanqin-jifa)                   -  441/  1%
    //  密宗心法 (lamaism)                       -  311/ 33%
    //  读书写字 (literate)                      -  573/  1%
    //  武学修养 (martial-cognize)               - 2700/ 20%
    //  回    文 (muslim)                        -  334/ 56%
    //  丹青艺术 (drawing)                       -  244/  1%
    //  算    术 (mathematics)                   -  589/  0%
    //  经 络 学 (jingluo-xue)                   -  451/  1%
    //  左右互搏 (zuoyou-hubo)                   -  491/  0%
    //  禅宗心法 (buddhism)                      -  614/ 29%
    //  梵    文 (sanscrit)                      -  304/ 27%
    //≡──────────────────────────≡
    var matcherChaStart = /^≡─+─≡$/
    var matcherSkills = /^(  |□)([^\(\)]+)\s\((\S+)\)\s+\-\s*(\d+)\/\s*(\d+)%\s*/
    //处理skills结果的计划
    var PlanOnSkills = new App.Plan(App.Positions.Connect,
        function (task) {
            var chastartcount = 0
            task.AddTrigger(matcherChaStart, function (trigger, result, event) {
                chastartcount++
                return chastartcount < 2
            })
            task.AddTrigger(matcherSkills, function (trigger, result, event) {
                let skill = {
                    "受限经验": true,
                    "空手武学": false,
                    "兵器武学": false,
                    "音乐": false,
                }
                skill.ID = result[3]
                skill["名称"] = result[2].replaceAll(" ", "")
                skill["激发"] = (result[1].trim() != "")
                skill["等级"] = result[4] - 0
                skill["进度"] = result[5] - 0
                if (App.Core.Player.BasicSkills[skill.ID]) {
                    LastBasic = skill.ID
                }
                if (App.Core.Player.KnowledgeSkills[skill.ID]) {
                    skill["基本"] = "knowledge"
                    skill["受限经验"] = App.Core.Player.KnowledgeSkills[skill.ID] != "f"
                } else {
                    skill["基本"] = LastBasic
                    let basictype = App.Core.Player.BasicSkills[LastBasic]
                    switch (basictype) {
                        case "音乐":
                            skill["音乐"] = true
                            skill["受限经验"] = false
                            break
                        case "知识":
                            skill["受限经验"] = false
                            break
                        case "空手武学":
                            skill["空手武学"] = true
                            break
                        case "兵器武学":
                            skill["兵器武学"] = true
                            break

                    }
                }

                App.Data.Player.Skills[skill.ID] = skill
                return true
            })
            task.AddTimer(5000)
        },
        function (result) {
            checkerSkills.Reset()
        })
    App.Core.OnNoSkill = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.Skills = {}
            LastBasic = ""
        })
    }
    App.BindEvent("core.noskill", App.Core.OnNoSkill)

    //cha force(检查是否正确激活了内功，失败基本是挂了)
    App.Core.OnChaForce = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.NoForce = true
            PlanOnChaForce.Execute()
        })
    }
    //cha force的计划
    var PlanOnChaForce = new App.Plan(App.Positions.Connect,
        function (task) {
            var chastartcount = 0
            task.AddTrigger(matcherChaStart, function (trigger, result, event) {
                chastartcount++
                return chastartcount < 2
            })
            task.AddTrigger(matcherSkills, function (trigger, result, event) {
                if (result[2] != "基本内功") {
                    App.Data.Player.NoForce = false
                }
                return true
            })
            task.AddTimer(5000)
        })
    App.BindEvent("core.chaforce", App.Core.OnChaForce)
    //处理hp -m信息
    App.Core.OnHPM = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.HPM = {}
            PlanOnHPM.Execute()
        })
    }
    // ≡───────────────────────────────≡
    // 【精力上限】  28736                【内力上限】  352873
    // 【潜能上限】  119400               【体会上限】  8000
    // 【当前等级】  3618                 【升级所需】  2120386
    // 【最大加怒】  ───		   【最大加力】  2848
    // 【死亡保护】  保護中		              【杀戮保护】  無保護
    // ≡──────────────────────────ZHYX───≡

    var matcherHPMEnd = /^≡─+[^─]+─+≡$/
    var matcherHMP1 = /^【精力上限】\s*(\S+)\s*【内力上限】\s*(\S+)\s*$/
    var matcherHMP2 = /^【潜能上限】\s*(\S+)\s*【体会上限】\s*(\S+)\s*$/
    var matcherHMP3 = /^【当前等级】\s*(\S+)\s*【升级所需】\s*(\S+)\s*$/
    var matcherHMP4 = /^【最大加怒】\s*(\S+)\s*【最大加力】\s*(\S+)\s*$/
    var matcherHMP5 = /^【死亡保护】\s*(\S+)\s*【杀戮保护】\s*(\S+)\s*$/
    //处理hp -m的计划
    var PlanOnHPM = new App.Plan(App.Positions.Connect,
        function (task) {
            task.AddTrigger(matcherHMP1, function (trigger, result, event) {
                App.Data.Player.HPM["精力上限"] = result[1] - 0
                App.Data.Player.HPM["内力上限"] = result[2] - 0
                return true
            })
            task.AddTrigger(matcherHMP2, function (trigger, result, event) {
                App.Data.Player.HPM["潜能上限"] = result[1] - 0
                App.Data.Player.HPM["体会上限"] = result[2] - 0
                return true
            })
            task.AddTrigger(matcherHMP3, function (trigger, result, event) {
                App.Data.Player.HPM["当前等级"] = result[1] - 0
                App.Data.Player.HPM["升级所需"] = result[2] - 0
                return true
            })
            task.AddTrigger(matcherHMP4, function (trigger, result, event) {
                App.Data.Player.HPM["最大加怒"] = (result[1] - 0) || 0
                App.Data.Player.HPM["最大加力"] = result[2] - 0
                return true
            })
            task.AddTrigger(matcherHMP5, function (trigger, result, event) {
                App.Data.Player.HPM["死亡保护"] = result[1] == "保護中"
                App.Data.Player.HPM["杀戮保护"] = result[2] == "保護中"
                return true
            })
            task.AddTimer(5000)
            task.AddTrigger(matcherHPMEnd)
        },
        function (result) {
            checkerHPM.Reset()
        })
    //hpm的checker
    let checkerHPM = App.Checker.Register("hpm", "hp -m", 300000)
    App.BindEvent("core.hpm", App.Core.OnHPM)

    //jifa的checker
    let checkerJifa = App.Checker.Register("jifa", "jifa", 30 * 60 * 1000)
    App.Core.OnJifa = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.Jifa = {}
            PlanOnJifa.Execute()
        })
    }
    App.BindEvent("core.jifa", App.Core.OnJifa)

    //以下是你目前使用中的特殊技能。
    //  爪法 (claw)         ： 九阴白骨爪            有效等级：479
    //  内功 (force)        ： 浑天宝鉴              有效等级：4273
    //  拳法 (cuff)         ： 大金刚拳              有效等级：551
    //  指法 (finger)       ： 六脉神剑              有效等级：887
    //  轻功 (dodge)        ： 浑天宝鉴              有效等级：4064
    //  招架 (parry)        ： 浑天宝鉴              有效等级：4164
    //  拳脚 (unarmed)      ： 浑天宝鉴              有效等级：4266
    let matcherJifa = /^  (\S+)\s+\((.+)\)\s* ：\s+(\S+)\s*有效等级：\s*(\d+)\s*$/
    //处理jifa结果的计划
    var PlanOnJifa = new App.Plan(App.Positions.Connect,
        function (task) {
            task.AddTrigger(matcherJifa, function (trigger, result, event) {
                let jifa = {
                    Label: result[1],
                    ID: result[2],
                    Skill: result[3],
                    Level: result[4] - 0,
                }
                App.Data.Player.Jifa[jifa.ID] = jifa

                event.Context.Set("core.player.onjifa", true)
                return true
            })
            task.AddCatcher("line", function (catcher, event) {
                return event.Context.Get("core.player.onjifa")
            })
            task.AddTimer(5000)
        },
        function (result) {
            checkerJifa.Reset()
        })
    App.Core.OnNoJifa = function (event) {
        event.Context.Propose(function () {
            App.Data.Player.Jifa = {}
        })
    }
    App.BindEvent("core.nojifa", App.Core.OnNoJifa)

    //技能升级时重置相关的checker
    App.BindEvent("core.skillimproved", function () {
        checkerHPM.Force()
        checkerSkills.Force()
        checkerJifa.Force()
    })
    //获取最大经验设置
    App.Core.GetMaxExp = () => {
        let expmax = GetVariable("max_exp").trim()
        return (expmax && !isNaN(expmax)) ? expmax - 0 : 0
    }
    //离开pkd的计划
    let PlanLeavePkd = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.AddTrigger("你逃出了屠人场。", (tri, result) => {
                task.Data = "leave"
                return true
            })

            App.Send("quit")
            App.Sync()
        },
        (result) => {
            switch (result.Task.Data) {
                case "leave":
                    App.Next()
                    return
            }
            App.Fail()
        }
    )
    //吃magic water的计划
    let PlanEatLu = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.AddTrigger("你眼前忽然一花...", (tri, result) => {
                task.Data = "enter"
                return true
            })
            App.Send("join")
            App.Sync()
        },
        (result) => {
            switch (result.Task.Data) {
                case "enter":
                    App.Next()
                    return
            }
            App.Fail()
        }
    )
    //pkd的放箭名
    let pkd = {
        "屠人场": true,
        "宰人场": true,
        "剁人场": true,
        "碎尸场": true,
        "喋血场": true,
        "毒人场": true,
        "丧命场": true,
        "殒命场": true,
        "送命场": true,
        "宰人场": true,
        "诛人场": true,
        "戮人场": true,
    }
    //吃magic water的指令
    App.Core.EatLu = () => {
        $.PushCommands(
            $.To("306"),
            $.Plan(PlanEatLu),
            $.Function(() => {
                if (pkd[App.Map.Room.Name]) {
                    App.Send("eat magic water;hp;hp -m;i")
                    App.Next()
                    return
                }
                App.Fail()
            }),
            $.Nobusy(),
            $.Plan(PlanLeavePkd)
        )
        $.Next()
    }
    //bug
    let checkerBug = App.Checker.Register("bug", "bug", 30 * 60 * 1000)
    App.Core.OnBug = function (event) {
        checkerBug.Reset()
        event.Context.Propose(function () {
            App.Data.Player.BugPoint = event.Data.Wildcards[0] - 0
        })
    }
    App.BindEvent("core.bug", App.Core.OnBug)
    App.Core.OnBug0 = function (event) {
        checkerBug.Reset()
        event.Context.Propose(function () {
            App.Data.Player.BugPoint = 0
        })
    }
    App.BindEvent("core.bug0", App.Core.OnBug0)
})(App)