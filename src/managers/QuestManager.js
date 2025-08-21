// 任务管理器 - 提供多样化的游戏目标
export default class QuestManager {
  constructor() {
    // 任务状态
    this.dailyQuests = []
    this.weeklyQuests = []
    this.storyQuests = []
    this.achievements = []
    
    // 任务刷新时间
    this.lastDailyRefresh = 0
    this.lastWeeklyRefresh = 0
    
    // 任务模板
    this.questTemplates = this.initQuestTemplates()
    this.achievementTemplates = this.initAchievementTemplates()
    
    // 不在构造函数中调用init，等待setManagers后再初始化
  }
  
  // 设置管理器引用
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.gameManager = managers.gameManager
    
    // 设置完管理器后才初始化
    this.init()
  }
  
  init() {
    console.log('任务管理器初始化')
    this.loadQuestData()
    this.checkQuestRefresh()
    this.initStoryQuests()
  }
  
  // 初始化任务模板
  initQuestTemplates() {
    return {
      daily: [
        {
          id: 'daily_produce_potions',
          type: 'produce',
          title: '制作药水',
          description: '制作10瓶药水',
          target: { type: 'potions', amount: 10 },
          reward: { gold: 500, exp: 100 },
          difficulty: '简单'
        },
        {
          id: 'daily_serve_customers',
          type: 'serve',
          title: '服务顾客',
          description: '服务5位顾客',
          target: { type: 'customers', amount: 5 },
          reward: { gold: 300, reputation: 50 },
          difficulty: '简单'
        },
        {
          id: 'daily_earn_gold',
          type: 'earn',
          title: '赚取金币',
          description: '赚取1000金币',
          target: { type: 'gold', amount: 1000 },
          reward: { gems: 5, exp: 80 },
          difficulty: '中等'
        },
        {
          id: 'daily_upgrade_workshop',
          type: 'upgrade',
          title: '升级设施',
          description: '升级任意工作台1次',
          target: { type: 'workshop_upgrade', amount: 1 },
          reward: { gold: 800, gems: 3 },
          difficulty: '中等'
        },
        {
          id: 'daily_collect_fast',
          type: 'collect',
          title: '快速收集',
          description: '在30秒内收集5次生产',
          target: { type: 'fast_collect', amount: 5, timeLimit: 30000 },
          reward: { gold: 600, exp: 120 },
          difficulty: '困难'
        }
      ],
      weekly: [
        {
          id: 'weekly_total_production',
          type: 'produce',
          title: '大量生产',
          description: '制作100个物品',
          target: { type: 'total_items', amount: 100 },
          reward: { gold: 5000, gems: 20, exp: 500 },
          difficulty: '困难'
        },
        {
          id: 'weekly_vip_customers',
          type: 'serve',
          title: 'VIP服务',
          description: '服务10位贵族或急客',
          target: { type: 'vip_customers', amount: 10 },
          reward: { gold: 3000, reputation: 200, gems: 15 },
          difficulty: '困难'
        },
        {
          id: 'weekly_reputation',
          type: 'reputation',
          title: '声望提升',
          description: '获得500声望',
          target: { type: 'reputation', amount: 500 },
          reward: { gold: 4000, gems: 25 },
          difficulty: '中等'
        },
        {
          id: 'weekly_no_angry_customers',
          type: 'patience',
          title: '完美服务',
          description: '7天内不让任何顾客生气离开',
          target: { type: 'no_angry', amount: 0 },
          reward: { gold: 6000, gems: 30, special: 'patience_boost' },
          difficulty: '专家'
        }
      ],
      story: [
        {
          id: 'story_first_workshop',
          type: 'tutorial',
          title: '魔法商店的开始',
          description: '解锁第一个工作台',
          target: { type: 'unlock_workshop', amount: 1 },
          reward: { gold: 200, exp: 50 },
          unlockLevel: 1,
          nextQuest: 'story_first_customer'
        },
        {
          id: 'story_first_customer',
          type: 'tutorial',
          title: '第一位顾客',
          description: '成功服务第一位顾客',
          target: { type: 'serve_customer', amount: 1 },
          reward: { gold: 300, exp: 75 },
          unlockLevel: 1,
          nextQuest: 'story_reputation_100'
        },
        {
          id: 'story_reputation_100',
          type: 'milestone',
          title: '小有名气',
          description: '达到100声望',
          target: { type: 'reputation', amount: 100 },
          reward: { gold: 1000, gems: 5, unlock: 'auto_sell' },
          unlockLevel: 2,
          nextQuest: 'story_all_workshops'
        },
        {
          id: 'story_all_workshops',
          type: 'milestone',
          title: '全能法师',
          description: '解锁所有工作台',
          target: { type: 'unlock_all_workshops', amount: 3 },
          reward: { gold: 2000, gems: 10, unlock: 'workshop_sync' },
          unlockLevel: 5,
          nextQuest: 'story_master_crafter'
        },
        {
          id: 'story_master_crafter',
          type: 'endgame',
          title: '大师工匠',
          description: '将任意工作台升级到10级',
          target: { type: 'workshop_level', amount: 10 },
          reward: { gold: 5000, gems: 25, unlock: 'master_recipes' },
          unlockLevel: 10
        }
      ]
    }
  }
  
  // 初始化成就模板
  initAchievementTemplates() {
    return [
      {
        id: 'ach_first_million',
        title: '百万富翁',
        description: '累计赚取100万金币',
        target: { type: 'total_gold_earned', amount: 1000000 },
        reward: { gems: 50, title: '百万富翁' },
        tier: 'legendary'
      },
      {
        id: 'ach_speed_demon',
        title: '速度恶魔',
        description: '在10秒内服务3位顾客',
        target: { type: 'speed_serve', amount: 3, timeLimit: 10000 },
        reward: { gems: 20, unlock: 'speed_boost' },
        tier: 'epic'
      },
      {
        id: 'ach_customer_favorite',
        title: '顾客最爱',
        description: '连续50位顾客满意离开',
        target: { type: 'consecutive_happy', amount: 50 },
        reward: { gems: 30, reputation: 500 },
        tier: 'epic'
      },
      {
        id: 'ach_workshop_master',
        title: '工作台大师',
        description: '所有工作台达到5级',
        target: { type: 'all_workshops_level', amount: 5 },
        reward: { gems: 40, unlock: 'master_efficiency' },
        tier: 'legendary'
      },
      {
        id: 'ach_patience_saint',
        title: '耐心圣人',
        description: '让100位顾客在最后一秒被服务',
        target: { type: 'last_second_serve', amount: 100 },
        reward: { gems: 35, unlock: 'patience_vision' },
        tier: 'epic'
      }
    ]
  }
  
  // 初始化剧情任务
  initStoryQuests() {
    const playerLevel = this.dataManager.getLevel()
    const completedStory = this.dataManager.gameData.questData?.completedStoryQuests || []
    
    // 根据玩家等级和完成情况添加可用的剧情任务
    this.questTemplates.story.forEach(template => {
      if (playerLevel >= template.unlockLevel && !completedStory.includes(template.id)) {
        // 检查前置任务是否完成
        if (!template.previousQuest || completedStory.includes(template.previousQuest)) {
          this.addStoryQuest(template)
        }
      }
    })
  }
  
  // 加载任务数据
  loadQuestData() {
    const questData = this.dataManager.gameData.questData || {}
    
    this.dailyQuests = questData.dailyQuests || []
    this.weeklyQuests = questData.weeklyQuests || []
    this.storyQuests = questData.storyQuests || []
    this.achievements = questData.achievements || []
    this.lastDailyRefresh = questData.lastDailyRefresh || 0
    this.lastWeeklyRefresh = questData.lastWeeklyRefresh || 0
  }
  
  // 保存任务数据
  saveQuestData() {
    if (!this.dataManager.gameData.questData) {
      this.dataManager.gameData.questData = {}
    }
    
    this.dataManager.gameData.questData.dailyQuests = this.dailyQuests
    this.dataManager.gameData.questData.weeklyQuests = this.weeklyQuests
    this.dataManager.gameData.questData.storyQuests = this.storyQuests
    this.dataManager.gameData.questData.achievements = this.achievements
    this.dataManager.gameData.questData.lastDailyRefresh = this.lastDailyRefresh
    this.dataManager.gameData.questData.lastWeeklyRefresh = this.lastWeeklyRefresh
    
    this.dataManager.markDirty()
  }
  
  // 检查任务刷新
  checkQuestRefresh() {
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const oneWeekMs = 7 * oneDayMs
    
    // 检查每日任务刷新
    if (now - this.lastDailyRefresh > oneDayMs) {
      this.refreshDailyQuests()
      this.lastDailyRefresh = now
    }
    
    // 检查每周任务刷新
    if (now - this.lastWeeklyRefresh > oneWeekMs) {
      this.refreshWeeklyQuests()
      this.lastWeeklyRefresh = now
    }
  }
  
  // 刷新每日任务
  refreshDailyQuests() {
    console.log('刷新每日任务')
    
    // 清空当前每日任务
    this.dailyQuests = []
    
    // 随机选择3个每日任务
    const availableQuests = [...this.questTemplates.daily]
    const questCount = Math.min(3, availableQuests.length)
    
    for (let i = 0; i < questCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableQuests.length)
      const template = availableQuests.splice(randomIndex, 1)[0]
      
      const quest = this.createQuestFromTemplate(template)
      this.dailyQuests.push(quest)
    }
    
    this.saveQuestData()
    
    // 通知UI更新
    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.onQuestsUpdated()
    }
  }
  
  // 刷新每周任务
  refreshWeeklyQuests() {
    console.log('刷新每周任务')
    
    // 清空当前每周任务
    this.weeklyQuests = []
    
    // 随机选择2个每周任务
    const availableQuests = [...this.questTemplates.weekly]
    const questCount = Math.min(2, availableQuests.length)
    
    for (let i = 0; i < questCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableQuests.length)
      const template = availableQuests.splice(randomIndex, 1)[0]
      
      const quest = this.createQuestFromTemplate(template)
      this.weeklyQuests.push(quest)
    }
    
    this.saveQuestData()
    
    // 通知UI更新
    if (this.gameManager.uiManager) {
      this.gameManager.uiManager.onQuestsUpdated()
    }
  }
  
  // 从模板创建任务
  createQuestFromTemplate(template) {
    return {
      id: template.id + '_' + Date.now(),
      templateId: template.id,
      title: template.title,
      description: template.description,
      type: template.type,
      target: { ...template.target },
      progress: 0,
      completed: false,
      claimed: false,
      reward: { ...template.reward },
      difficulty: template.difficulty,
      startTime: Date.now(),
      timeLimit: template.target.timeLimit || null
    }
  }
  
  // 添加剧情任务
  addStoryQuest(template) {
    const quest = this.createQuestFromTemplate(template)
    quest.unlockLevel = template.unlockLevel
    quest.nextQuest = template.nextQuest
    
    this.storyQuests.push(quest)
    this.saveQuestData()
    
    console.log(`新增剧情任务: ${quest.title}`)
  }
  
  // 更新任务进度
  updateQuestProgress(eventType, data = {}) {
    let questsUpdated = false
    
    // 更新每日任务
    this.dailyQuests.forEach(quest => {
      if (!quest.completed && this.shouldUpdateQuest(quest, eventType, data)) {
        quest.progress = Math.min(quest.target.amount, quest.progress + (data.amount || 1))
        
        if (quest.progress >= quest.target.amount) {
          quest.completed = true
          this.onQuestCompleted(quest, 'daily')
        }
        questsUpdated = true
      }
    })
    
    // 更新每周任务
    this.weeklyQuests.forEach(quest => {
      if (!quest.completed && this.shouldUpdateQuest(quest, eventType, data)) {
        quest.progress = Math.min(quest.target.amount, quest.progress + (data.amount || 1))
        
        if (quest.progress >= quest.target.amount) {
          quest.completed = true
          this.onQuestCompleted(quest, 'weekly')
        }
        questsUpdated = true
      }
    })
    
    // 更新剧情任务
    this.storyQuests.forEach(quest => {
      if (!quest.completed && this.shouldUpdateQuest(quest, eventType, data)) {
        quest.progress = Math.min(quest.target.amount, quest.progress + (data.amount || 1))
        
        if (quest.progress >= quest.target.amount) {
          quest.completed = true
          this.onQuestCompleted(quest, 'story')
        }
        questsUpdated = true
      }
    })
    
    // 更新成就
    this.achievements.forEach(achievement => {
      if (!achievement.completed && this.shouldUpdateQuest(achievement, eventType, data)) {
        achievement.progress = Math.min(achievement.target.amount, achievement.progress + (data.amount || 1))
        
        if (achievement.progress >= achievement.target.amount) {
          achievement.completed = true
          this.onAchievementCompleted(achievement)
        }
        questsUpdated = true
      }
    })
    
    if (questsUpdated) {
      this.saveQuestData()
      
      // 通知UI更新
      if (this.gameManager.uiManager) {
        this.gameManager.uiManager.onQuestsUpdated()
      }
    }
  }
  
  // 判断是否应该更新任务
  shouldUpdateQuest(quest, eventType, data) {
    const target = quest.target
    
    switch (target.type) {
      case 'potions':
        return eventType === 'item_produced' && data.itemType === 'potions'
      case 'enchantments':
        return eventType === 'item_produced' && data.itemType === 'enchantments'
      case 'crystals':
        return eventType === 'item_produced' && data.itemType === 'crystals'
      case 'total_items':
        return eventType === 'item_produced'
      case 'customers':
        return eventType === 'customer_served'
      case 'vip_customers':
        return eventType === 'customer_served' && (data.customerType === '贵族' || data.customerType === '急客')
      case 'gold':
        return eventType === 'gold_earned'
      case 'total_gold_earned':
        return eventType === 'gold_earned'
      case 'reputation':
        return eventType === 'reputation_gained'
      case 'workshop_upgrade':
        return eventType === 'workshop_upgraded'
      case 'unlock_workshop':
        return eventType === 'workshop_unlocked'
      case 'unlock_all_workshops':
        return eventType === 'all_workshops_unlocked'
      case 'workshop_level':
        return eventType === 'workshop_upgraded' && data.level >= target.amount
      case 'all_workshops_level':
        return eventType === 'all_workshops_level_reached' && data.level >= target.amount
      case 'fast_collect':
        return eventType === 'production_collected' && this.isWithinTimeLimit(quest, data)
      case 'no_angry':
        return eventType === 'customer_angry'
      case 'serve_customer':
        return eventType === 'customer_served'
      case 'speed_serve':
        return eventType === 'customer_served' && this.isWithinTimeLimit(quest, data)
      case 'consecutive_happy':
        return eventType === 'customer_served' && data.satisfied
      case 'last_second_serve':
        return eventType === 'customer_served' && data.lastSecond
      default:
        return false
    }
  }
  
  // 检查时间限制
  isWithinTimeLimit(quest, data) {
    if (!quest.timeLimit) return true
    
    const now = Date.now()
    if (!quest.timeStarted) {
      quest.timeStarted = now
      quest.timeProgress = 0
    }
    
    return (now - quest.timeStarted) <= quest.target.timeLimit
  }
  
  // 任务完成处理
  onQuestCompleted(quest, questType) {
    console.log(`任务完成: ${quest.title} (${questType})`)
    
    // 创建完成特效
    this.gameManager.createFireworkEffect(
      this.gameManager.canvas.width / 2,
      this.gameManager.canvas.height / 3,
      '#FFD700'
    )
    
    // 显示完成提示
    this.gameManager.createFloatingText(
      `任务完成: ${quest.title}!`,
      this.gameManager.canvas.width / 2,
      this.gameManager.canvas.height / 3,
      '#FFD700',
      20
    )
    
    // 检查是否有下一个剧情任务
    if (questType === 'story' && quest.nextQuest) {
      const nextTemplate = this.questTemplates.story.find(t => t.id === quest.nextQuest)
      if (nextTemplate && this.dataManager.getLevel() >= nextTemplate.unlockLevel) {
        this.addStoryQuest(nextTemplate)
      }
    }
  }
  
  // 成就完成处理
  onAchievementCompleted(achievement) {
    console.log(`成就解锁: ${achievement.title}`)
    
    // 创建特殊的成就特效
    this.gameManager.createFireworkEffect(
      this.gameManager.canvas.width / 2,
      this.gameManager.canvas.height / 2,
      '#FF6B6B'
    )
    
    // 显示成就解锁提示
    this.gameManager.createFloatingText(
      `🏆 成就解锁: ${achievement.title}!`,
      this.gameManager.canvas.width / 2,
      this.gameManager.canvas.height / 2,
      '#FF6B6B',
      24
    )
  }
  
  // 领取任务奖励
  claimQuestReward(questId, questType) {
    let quest = null
    
    switch (questType) {
      case 'daily':
        quest = this.dailyQuests.find(q => q.id === questId)
        break
      case 'weekly':
        quest = this.weeklyQuests.find(q => q.id === questId)
        break
      case 'story':
        quest = this.storyQuests.find(q => q.id === questId)
        break
      case 'achievement':
        quest = this.achievements.find(q => q.id === questId)
        break
    }
    
    if (!quest || !quest.completed || quest.claimed) {
      return false
    }
    
    // 发放奖励
    this.giveReward(quest.reward)
    
    // 标记为已领取
    quest.claimed = true
    
    // 如果是剧情任务，添加到完成列表
    if (questType === 'story') {
      if (!this.dataManager.gameData.questData.completedStoryQuests) {
        this.dataManager.gameData.questData.completedStoryQuests = []
      }
      this.dataManager.gameData.questData.completedStoryQuests.push(quest.templateId)
    }
    
    this.saveQuestData()
    
    console.log(`领取奖励: ${quest.title}`)
    return true
  }
  
  // 发放奖励
  giveReward(reward) {
    if (reward.gold) {
      this.dataManager.addGold(reward.gold)
      this.gameManager.createFloatingText(
        `+${reward.gold} 金币`,
        this.gameManager.canvas.width / 2,
        this.gameManager.canvas.height / 2 + 40,
        '#FFD700'
      )
    }
    
    if (reward.gems) {
      this.dataManager.addGems(reward.gems)
      this.gameManager.createFloatingText(
        `+${reward.gems} 宝石`,
        this.gameManager.canvas.width / 2,
        this.gameManager.canvas.height / 2 + 60,
        '#FF69B4'
      )
    }
    
    if (reward.exp) {
      this.dataManager.addExp(reward.exp)
      this.gameManager.createFloatingText(
        `+${reward.exp} 经验`,
        this.gameManager.canvas.width / 2,
        this.gameManager.canvas.height / 2 + 80,
        '#00FF00'
      )
    }
    
    if (reward.reputation) {
      this.dataManager.gameData.reputation += reward.reputation
      this.gameManager.createFloatingText(
        `+${reward.reputation} 声望`,
        this.gameManager.canvas.width / 2,
        this.gameManager.canvas.height / 2 + 100,
        '#9370DB'
      )
    }
    
    // 处理特殊奖励解锁
    if (reward.unlock) {
      this.unlockFeature(reward.unlock)
    }
    
    if (reward.special) {
      this.applySpecialReward(reward.special)
    }
  }
  
  // 解锁功能
  unlockFeature(featureId) {
    switch (featureId) {
      case 'auto_sell':
        this.dataManager.gameData.unlockedFeatures = this.dataManager.gameData.unlockedFeatures || []
        if (!this.dataManager.gameData.unlockedFeatures.includes('auto_sell')) {
          this.dataManager.gameData.unlockedFeatures.push('auto_sell')
          this.gameManager.createFloatingText(
            '🤖 解锁自动售卖!',
            this.gameManager.canvas.width / 2,
            this.gameManager.canvas.height / 2 + 120,
            '#00FFFF',
            18
          )
        }
        break
      case 'workshop_sync':
        this.dataManager.gameData.unlockedFeatures = this.dataManager.gameData.unlockedFeatures || []
        if (!this.dataManager.gameData.unlockedFeatures.includes('workshop_sync')) {
          this.dataManager.gameData.unlockedFeatures.push('workshop_sync')
          this.gameManager.createFloatingText(
            '⚡ 解锁工作台同步!',
            this.gameManager.canvas.width / 2,
            this.gameManager.canvas.height / 2 + 120,
            '#FFFF00',
            18
          )
        }
        break
      // 可以添加更多功能解锁
    }
    
    this.dataManager.markDirty()
  }
  
  // 应用特殊奖励
  applySpecialReward(specialId) {
    switch (specialId) {
      case 'patience_boost':
        // 临时增加所有顾客的耐心值
        this.gameManager.customers.forEach(customer => {
          customer.patience += 5000 // 增加5秒耐心
        })
        this.gameManager.createFloatingText(
          '⏰ 顾客耐心提升!',
          this.gameManager.canvas.width / 2,
          this.gameManager.canvas.height / 2 + 120,
          '#FFA500',
          18
        )
        break
      // 可以添加更多特殊奖励
    }
  }
  
  // 获取所有活跃任务
  getAllActiveQuests() {
    return {
      daily: this.dailyQuests.filter(q => !q.completed || !q.claimed),
      weekly: this.weeklyQuests.filter(q => !q.completed || !q.claimed),
      story: this.storyQuests.filter(q => !q.completed || !q.claimed),
      achievements: this.achievements.filter(q => !q.completed || !q.claimed)
    }
  }
  
  // 获取任务进度信息
  getQuestProgress(questId, questType) {
    let quest = null
    
    switch (questType) {
      case 'daily':
        quest = this.dailyQuests.find(q => q.id === questId)
        break
      case 'weekly':
        quest = this.weeklyQuests.find(q => q.id === questId)
        break
      case 'story':
        quest = this.storyQuests.find(q => q.id === questId)
        break
      case 'achievement':
        quest = this.achievements.find(q => q.id === questId)
        break
    }
    
    if (!quest) return null
    
    return {
      progress: quest.progress,
      target: quest.target.amount,
      percentage: (quest.progress / quest.target.amount) * 100,
      completed: quest.completed,
      claimed: quest.claimed
    }
  }
  
  // 检查是否有可领取的奖励
  hasClaimableRewards() {
    const allQuests = [
      ...this.dailyQuests,
      ...this.weeklyQuests,
      ...this.storyQuests,
      ...this.achievements
    ]
    
    return allQuests.some(quest => quest.completed && !quest.claimed)
  }
  
  // 更新方法（在游戏主循环中调用）
  update(deltaTime) {
    // 检查任务刷新
    this.checkQuestRefresh()
    
    // 检查时间限制任务
    this.updateTimeLimitedQuests(deltaTime)
  }
  
  // 更新有时间限制的任务
  updateTimeLimitedQuests(deltaTime) {
    const allQuests = [
      ...this.dailyQuests,
      ...this.weeklyQuests,
      ...this.achievements
    ]
    
    allQuests.forEach(quest => {
      if (quest.target.timeLimit && quest.timeStarted && !quest.completed) {
        const elapsed = Date.now() - quest.timeStarted
        if (elapsed > quest.target.timeLimit) {
          // 时间限制任务失败，重置进度
          quest.progress = 0
          quest.timeStarted = null
          quest.timeProgress = 0
        }
      }
    })
  }
}
