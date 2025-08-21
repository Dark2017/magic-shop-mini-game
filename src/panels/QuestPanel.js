// 任务面板 - 显示每日、周常、剧情任务和成就
import UIUtils from '../utils/UIUtils.js'
import Button from '../components/Button.js'
import { BUTTON_TYPES } from '../config/colors.js'

export default class QuestPanel {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.dataManager = null
    this.questManager = null
    this.gameManager = null
    
    // 面板属性
    this.isVisible = false
    this.closeButton = null
    
    // 滚动相关
    this.scrollY = 0
    this.maxScrollY = 0
    this.scrollSpeed = 30
    
    // 标签页
    this.currentTab = 'daily' // daily, weekly, story, achievements
    this.tabs = [
      { id: 'daily', name: '📅 每日', emoji: '📅' },
      { id: 'weekly', name: '📋 周常', emoji: '📋' },
      { id: 'story', name: '📖 剧情', emoji: '📖' },
      { id: 'achievements', name: '🏆 成就', emoji: '🏆' }
    ]
    
    // 任务项目和按钮
    this.questItems = []
    this.claimButtons = []
    this.tabButtons = []
  }
  
  setQuestManager(questManager) {
    this.questManager = questManager
    this.refreshQuestItems()
  }
  
  // 为了与其他面板保持一致的接口
  setManagers(managers) {
    if (managers.questManager) {
      this.setQuestManager(managers.questManager)
    }
    if (managers.dataManager) {
      this.dataManager = managers.dataManager
    }
  }
  
  createTabButtons() {
    this.tabButtons = []
    const tabWidth = this.width / this.tabs.length
    
    this.tabs.forEach((tab, index) => {
      const button = new Button(
        this.ctx,
        this.x + index * tabWidth,
        this.y + 50,
        tabWidth,
        35,
        tab.name,
        this.currentTab === tab.id ? BUTTON_TYPES.PRIMARY : BUTTON_TYPES.SECONDARY
      )
      button.tabId = tab.id
      this.tabButtons.push(button)
    })
  }
  
  show() {
    this.isVisible = true
    this.refreshQuestItems()
  }
  
  hide() {
    this.isVisible = false
  }
  
  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }
  
  switchTab(tabId) {
    if (this.currentTab === tabId) return
    
    this.currentTab = tabId
    this.scrollY = 0
    this.refreshQuestItems()
  }
  
  refreshQuestItems() {
    if (!this.questManager) return
    
    this.questItems = []
    this.claimButtons = []
    
    let quests = []
    switch (this.currentTab) {
      case 'daily':
        quests = this.questManager.dailyQuests
        break
      case 'weekly':
        quests = this.questManager.weeklyQuests
        break
      case 'story':
        quests = this.questManager.storyQuests
        break
      case 'achievements':
        quests = this.questManager.achievements
        break
    }
    
    // 创建任务项目
    let yOffset = 100
    const itemHeight = 120
    const itemSpacing = 10
    
    quests.forEach((quest, index) => {
      const itemY = this.y + yOffset + index * (itemHeight + itemSpacing)
      
      const questItem = {
        quest,
        x: this.x + 10,
        y: itemY,
        width: this.width - 20,
        height: itemHeight
      }
      
      this.questItems.push(questItem)
      
      // 如果任务完成但未领取，创建领取按钮
      if (quest.completed && !quest.claimed) {
        const claimButton = new Button(
          this.ctx,
          questItem.x + questItem.width - 100,
          questItem.y + questItem.height - 40,
          90,
          30,
          '领取奖励',
          BUTTON_TYPES.SUCCESS
        )
        claimButton.questId = quest.id
        claimButton.questType = this.currentTab
        this.claimButtons.push(claimButton)
      }
    })
    
    // 计算最大滚动距离
    const totalHeight = quests.length * (itemHeight + itemSpacing)
    const visibleHeight = this.height - 150
    this.maxScrollY = Math.max(0, totalHeight - visibleHeight)
  }
  
  render() {
    if (!this.isVisible) return
    
    const panelWidth = Math.min(370, this.canvas.width - 30)
    const panelHeight = 600
    const x = (this.canvas.width - panelWidth) / 2
    const y = (this.canvas.height - panelHeight) / 2
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 面板背景 - 使用魔法商店主题色
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(x, y, panelWidth, panelHeight)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, panelWidth, panelHeight)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('📋 任务中心', x + panelWidth / 2, y + 35)
    
    // 关闭按钮 - 使用工作台面板的关闭按钮样式和位置
    this.closeButton = {
      x: x + panelWidth - 40,
      y: y + 10,
      width: 30,
      height: 30
    }
    this.renderCloseButton()
    
    // 标签页区域
    this.renderTabs(x, y, panelWidth)
    
    // 任务列表区域
    this.renderQuestList(x, y + 100, panelWidth, panelHeight - 100)
  }
  
  renderTabs(x, y, panelWidth) {
    // 标签区域背景
    this.ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'
    this.ctx.fillRect(x, y + 50, panelWidth, 40)
    
    // 绘制标签按钮 - 调整间距以适应面板宽度
    this.tabButtons = []
    const tabSpacing = 5 // 减少间距
    const totalTabWidth = panelWidth - 20 // 总可用宽度
    const tabWidth = (totalTabWidth - (this.tabs.length - 1) * tabSpacing) / this.tabs.length
    const tabHeight = 28 // 略微减小高度
    const tabY = y + 56
    const tabStartX = x + 10
    
    this.tabs.forEach((tab, index) => {
      const tabX = tabStartX + index * (tabWidth + tabSpacing)
      const isActive = this.currentTab === tab.id
      
      // 标签背景
      if (isActive) {
        const gradient = this.ctx.createLinearGradient(tabX, tabY, tabX, tabY + tabHeight)
        gradient.addColorStop(0, '#FFD700')
        gradient.addColorStop(1, '#B8860B')
        this.ctx.fillStyle = gradient
      } else {
        this.ctx.fillStyle = '#8B4513'
      }
      
      UIUtils.drawRoundRect(this.ctx, { x: tabX, y: tabY, width: tabWidth, height: tabHeight }, null, 8)
      
      // 标签边框
      this.ctx.strokeStyle = isActive ? '#FFD700' : '#A0522D'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(tabX, tabY, tabWidth, tabHeight)
      
      // 标签文字 - 缩短文字以适应
      this.ctx.fillStyle = isActive ? '#2C1810' : '#FFFFFF'
      this.ctx.font = 'bold 10px Arial'
      this.ctx.textAlign = 'center'
      const shortName = tab.name.length > 6 ? tab.emoji + tab.name.slice(2, 4) : tab.name
      this.ctx.fillText(shortName, tabX + tabWidth / 2, tabY + tabHeight / 2 + 3)
      
      // 保存标签按钮区域
      this.tabButtons.push({
        id: tab.id,
        x: tabX,
        y: tabY,
        width: tabWidth,
        height: tabHeight
      })
    })
  }
  
  renderQuestList(x, y, panelWidth, listHeight) {
    if (!this.questManager) {
      this.ctx.fillStyle = '#CCCCCC'
      this.ctx.font = '16px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('任务系统未初始化', x + panelWidth / 2, y + 100)
      return
    }
    
    // 获取当前标签的任务
    let quests = []
    switch (this.currentTab) {
      case 'daily':
        quests = this.questManager.dailyQuests || []
        break
      case 'weekly':
        quests = this.questManager.weeklyQuests || []
        break
      case 'story':
        quests = this.questManager.storyQuests || []
        break
      case 'achievements':
        quests = this.questManager.achievements || []
        break
    }
    
    if (quests.length === 0) {
      this.ctx.fillStyle = '#CCCCCC'
      this.ctx.font = '16px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(this.getEmptyMessage(), x + panelWidth / 2, y + 100)
      return
    }
    
    // 任务列表区域参数
    const scrollAreaWidth = panelWidth - 40
    const scrollAreaHeight = listHeight - 40
    const scrollAreaX = x + 10
    const scrollAreaY = y + 10
    
    // 设置裁剪区域
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(scrollAreaX, scrollAreaY, scrollAreaWidth, scrollAreaHeight)
    this.ctx.clip()
    
    // 重新计算任务项目位置
    this.questItems = []
    this.claimButtons = []
    
    const itemHeight = 90
    const itemSpacing = 10
    let currentY = scrollAreaY + 10 - this.scrollY
    
    quests.forEach((quest, index) => {
      // 只渲染在可视区域内的任务
      if (currentY + itemHeight >= scrollAreaY && currentY <= scrollAreaY + scrollAreaHeight) {
        this.renderQuestItem(quest, scrollAreaX + 5, currentY, scrollAreaWidth - 30, itemHeight)
      }
      currentY += itemHeight + itemSpacing
    })
    
    this.ctx.restore()
    
    // 更新滚动范围
    const totalHeight = quests.length * (itemHeight + itemSpacing) + 20
    this.maxScrollY = Math.max(0, totalHeight - scrollAreaHeight)
    
    // 绘制滚动条
    this.renderScrollbar(scrollAreaX + scrollAreaWidth - 15, scrollAreaY, 10, scrollAreaHeight)
  }
  
  renderCloseButton() {
    if (!this.closeButton) return
    
    // 使用工作台面板的关闭按钮样式
    UIUtils.drawRoundRect(this.ctx, this.closeButton, '#FF4444', 12)
    
    // 按钮文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('✖', this.closeButton.x + this.closeButton.width / 2, this.closeButton.y + this.closeButton.height / 2 + 5)
  }
  
  renderQuestItem(quest, x, y, width, height) {
    // 绘制任务背景
    let bgColor
    if (quest.completed) {
      bgColor = quest.claimed ? 'rgba(34, 139, 34, 0.2)' : 'rgba(255, 215, 0, 0.2)'
    } else {
      bgColor = 'rgba(139, 69, 19, 0.1)'
    }
    
    this.ctx.fillStyle = bgColor
    UIUtils.drawRoundRect(this.ctx, { x, y, width, height }, null, 8)
    
    // 绘制任务边框
    this.ctx.strokeStyle = quest.completed ? '#228B22' : '#8B4513'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x, y, width, height)
    
    // 绘制任务标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(quest.title, x + 15, y + 20)
    
    // 绘制难度标签
    if (quest.difficulty) {
      const difficultyColor = this.getDifficultyColor(quest.difficulty)
      this.ctx.fillStyle = difficultyColor
      this.ctx.font = '10px Arial'
      this.ctx.fillText(`[${quest.difficulty.toUpperCase()}]`, x + 15, y + 35)
    }
    
    // 绘制任务描述
    this.ctx.fillStyle = '#DEB887'
    this.ctx.font = '12px Arial'
    this.ctx.fillText(quest.description, x + 15, y + 50)
    
    // 绘制进度条
    this.renderProgressBar(quest, x + 15, y + 60, width - 30, 12)
    
    // 绘制进度文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'right'
    this.ctx.fillText(
      `${quest.progress}/${quest.target.amount}`,
      x + width - 15,
      y + 80
    )
    
    // 绘制状态标识和领取按钮
    if (quest.completed && !quest.claimed) {
      // 绘制领取按钮 - 调整margin保持上下至少10px
      const buttonX = x + width - 85
      const buttonY = y + height - 35  // 增加下margin到10px
      const buttonWidth = 70
      const buttonHeight = 20
      
      // 按钮背景
      const buttonGradient = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight)
      buttonGradient.addColorStop(0, '#32CD32')
      buttonGradient.addColorStop(1, '#228B22')
      this.ctx.fillStyle = buttonGradient
      UIUtils.drawRoundRect(this.ctx, { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight }, null, 4)
      
      // 按钮边框
      this.ctx.strokeStyle = '#FFD700'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight)
      
      // 按钮文字
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = 'bold 10px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('领取奖励', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 3)
      
      // 保存按钮信息供点击检测
      this.claimButtons.push({
        questId: quest.id,
        questType: this.currentTab,
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
      })
    } else if (quest.completed && quest.claimed) {
      // 显示已完成状态
      this.ctx.fillStyle = '#32CD32'
      this.ctx.font = 'bold 12px Arial'
      this.ctx.textAlign = 'right'
      this.ctx.fillText('✓ 已完成', x + width - 15, y + 20)
    }
  }
  
  renderProgressBar(quest, x, y, width, height) {
    // 进度条背景
    this.ctx.fillStyle = '#3C2415'
    this.ctx.fillRect(x, y, width, height)
    
    // 进度条填充
    const progress = quest.progress / quest.target.amount
    const fillWidth = width * Math.min(1, progress)
    
    if (fillWidth > 0) {
      const progressColor = quest.completed ? '#32CD32' : '#FFD700'
      this.ctx.fillStyle = progressColor
      this.ctx.fillRect(x, y, fillWidth, height)
    }
    
    // 进度条边框
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, width, height)
  }
  
  renderRewardInfo(reward, x, y) {
    let rewardText = '奖励: '
    const rewards = []
    
    if (reward.gold) rewards.push(`${reward.gold}金币`)
    if (reward.gems) rewards.push(`${reward.gems}宝石`)
    if (reward.exp) rewards.push(`${reward.exp}经验`)
    if (reward.reputation) rewards.push(`${reward.reputation}声望`)
    if (reward.unlock) rewards.push(`解锁: ${reward.unlock}`)
    
    rewardText += rewards.join(', ')
    
    this.ctx.fillStyle = '#DEB887'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(rewardText, x, y)
  }
  
  renderScrollbar(x, y, width, height) {
    if (this.maxScrollY <= 0) return
    
    // 滚动条轨道
    this.ctx.fillStyle = '#3C2415'
    this.ctx.fillRect(x, y, width, height)
    
    // 滚动条边框
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, width, height)
    
    // 滚动条滑块
    const scrollRatio = this.scrollY / this.maxScrollY
    const visibleRatio = height / (height + this.maxScrollY)
    const thumbHeight = Math.max(20, height * visibleRatio)
    const thumbY = y + scrollRatio * (height - thumbHeight)
    
    // 滑块背景
    const gradient = this.ctx.createLinearGradient(x, thumbY, x + width, thumbY)
    gradient.addColorStop(0, '#FFD700')
    gradient.addColorStop(1, '#B8860B')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(x + 1, thumbY, width - 2, thumbHeight)
    
    // 滑块边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x + 1, thumbY, width - 2, thumbHeight)
  }
  
  getDifficultyColor(difficulty) {
    const colors = {
      'easy': '#32CD32',
      'medium': '#FFD700', 
      'hard': '#FF6347',
      'expert': '#8A2BE2'
    }
    return colors[difficulty] || '#DEB887'
  }
  
  getEmptyMessage() {
    const messages = {
      'daily': '今日无任务',
      'weekly': '本周无任务',
      'story': '暂无剧情任务',
      'achievements': '暂无可用成就'
    }
    return messages[this.currentTab] || '暂无任务'
  }
  
  handleTouch(x, y) {
    if (!this.isVisible) return false
    
    // 检查关闭按钮
    if (this.isPointInButton(x, y, this.closeButton)) {
      this.hide()
      return true
    }
    
    // 检查标签按钮
    for (const button of this.tabButtons) {
      if (this.isPointInButton(x, y, button)) {
        this.switchTab(button.id)
        return true
      }
    }
    
    // 检查领取按钮
    for (const button of this.claimButtons) {
      if (this.isPointInButton(x, y, button)) {
        this.claimReward(button.questId, button.questType)
        return true
      }
    }
    
    return false
  }
  
  // 触摸开始事件
  handleTouchStart(x, y) {
    // 目前QuestPanel不需要特殊的触摸开始处理
    return false
  }
  
  // 触摸移动事件（用于滚动）
  handleTouchMove(x, y, deltaX, deltaY) {
    if (!this.isVisible) return false
    
    // 处理垂直滚动
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return this.handleScroll(deltaY)
    }
    
    return false
  }
  
  // 触摸结束事件
  handleTouchEnd(x, y, deltaX, deltaY, touchDuration) {
    if (!this.isVisible) return false
    
    // 如果有明显的滚动，不处理点击
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      return false
    }
    
    // 处理点击事件
    return this.handleTouch(x, y)
  }
  
  isPointInButton(x, y, button) {
    if (!button) return false
    return x >= button.x && x <= button.x + button.width &&
           y >= button.y && y <= button.y + button.height
  }
  
  claimReward(questId, questType) {
    if (!this.questManager) return
    
    const success = this.questManager.claimQuestReward(questId, questType)
    if (success) {
      // 刷新任务列表
      this.refreshQuestItems()
      
      // 可以添加领取成功的特效
      console.log(`成功领取任务奖励: ${questId}`)
    }
  }
  
  handleScroll(deltaY) {
    if (!this.isVisible || this.maxScrollY <= 0) return false
    
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + deltaY))
    return true
  }
  
  // 由UIManager调用，用于任务更新时刷新界面
  onQuestsUpdated() {
    if (this.isVisible) {
      this.refreshQuestItems()
    }
  }
  
  // 检查是否有可领取的奖励（用于显示红点提示）
  hasClaimableRewards() {
    if (!this.questManager) return false
    return this.questManager.hasClaimableRewards()
  }
  
  // 获取当前标签的任务统计
  getCurrentTabStats() {
    if (!this.questManager) return { total: 0, completed: 0, claimed: 0 }
    
    let quests = []
    switch (this.currentTab) {
      case 'daily':
        quests = this.questManager.dailyQuests
        break
      case 'weekly':
        quests = this.questManager.weeklyQuests
        break
      case 'story':
        quests = this.questManager.storyQuests
        break
      case 'achievements':
        quests = this.questManager.achievements
        break
    }
    
    return {
      total: quests.length,
      completed: quests.filter(q => q.completed).length,
      claimed: quests.filter(q => q.claimed).length,
      available: quests.filter(q => q.completed && !q.claimed).length
    }
  }
}
