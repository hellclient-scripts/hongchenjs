# 变量设置参考

## id

```
jarlyyn
```
游戏id

## cmd_ride
```
ride imez-zdog
```
骑宠物的指令，会自动whistle

## miss_list
```
hszz|4109
```
用来miss的10lv的位置，一行一个，会自动stab

## quest
```
```
任务列表。可以使用#mq,#mq2,#mq3等指令而不使用quest变量
## combat
```
#before yun recover
#start #wpon;perform sword.kuang 
perform sword.kuang
```
#before会在下kill前用一次
#start 会在下kill后用一次
不带#的指令会每半秒用一次

## command
```
#prepare yun powerup;yun jinshen
#wait #jiqu
#mqbefore #yanjiulian
#npcdie #yanjiulian
#moveyanjiu #yanjiu
```
自定义时间出发时的指令，主要是powerup和各种穿插汲取研究

## max_pot

```
0
```
设为0会不会因为潜能满了去学习研究。会在移动时尝试消耗潜能

## study
```
force||yanjiu
unarmed||yanjiu
dodge||yanjiu
parry||yanjiu
huntian-baojian||yanjiu
```
参考变量说明，默认是学习最低的技能。可以用#yanjiu和#yanjiulian指令，在合适的时候研究可用的技能

## jifa
```
jifa force huntian-baojian
jifa dodge huntian-baojian
jifa parry huntian-baojian
jifa unarmed huntian-baojian
jifa finger liumai-shenjian
jifa cuff jingang-quan
jifa claw jiuyin-baiguzhao
```

设置jifa的指令，请不要用enable

设置过的jifa,会在lian 技能后jifa回来

## house

```
机器人工厂 robot 4084 password
```
具体参考变量说明。彩虹和独乐需要加入c或d前缀

## sell
```
#carry id=huogu lingyao
```
战利品处理指令

mq需要answer Y的道具可以通过#home或者#carry设置

预设#home或者#sell的道具可以通过#carry设置为带在身上


## jiqu
```
5000
```
体会超过多少去jiqu

## params和questparams

不要设置，这两个变量需要通过助理按钮的对应按钮进行设置