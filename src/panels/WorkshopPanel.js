import UIUtils from '../utils/UIUtils.js'

// 工作台详情面板组件
export default class WorkshopPanel {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.isVisible = false
    this.closeButton = null
    this.workshopButtons = []
    this.dataManager = null
    this.gameManager = null
    this.questManager = null
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.gameManager = managers.gameManager
    this.questManager = managers.questManager
  }
  
  show() {
    this.isVisible = true
  }
  
  hide() {
    this.isVisible = false
  }
  
  render(dataManager, gameManager) {
    if (!this.isVisible) return
    
    const panelWidth = Math.min(370, this.canvas.width - 30)
    const panelHeight = 600
    const x = (this.canvas.width - panelWidth) / 2
    const y = (this.canvas.height - panelHeight) / 2
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 面板背景
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(x, y, panelWidth, panelHeight)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, panelWidth, panelHeight)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('🏭 工作台管理', x + panelWidth / 2, y + 35)
    
    // 获取所有工作台（包括未建造的）
    const allWorkshops = dataManager.getWorkshops()
    let currentY = y + 70
    this.workshopButtons = []
    
    allWorkshops.forEach((workshop, index) => {
      const workshopRect = {
        x: x + 20,
        y: currentY,
        width: panelWidth - 40,
        height: 120  // 增加高度以容纳所有内容
      }
      
      this.renderWorkshopItem(workshop, index, workshopRect, dataManager, gameManager)
      currentY += 130  // 相应增加间距
    })
    
    // 关闭按钮
    this.closeButton = {
      x: x + panelWidth - 40,
      y: y + 10,
      width: 30,
      height: 30
    }
    this.renderCloseButton()
  }
  
  renderWorkshopItem(workshop, index, workshopRect, dataManager, gameManager) {
    // 工作台背景 - 根据建造状态和生产状态使用不同颜色
    const gradient = this.ctx.createLinearGradient(workshopRect.x, workshopRect.y, workshopRect.x, workshopRect.y + workshopRect.height)
    
    if (!workshop.unlocked) {
      // 未建造工作台 - 使用暗灰色
      gradient.addColorStop(0, '#424242')
      gradient.addColorStop(1, '#212121')
    } else if (workshop.producing) {
      // 生产中工作台 - 使用绿色
      gradient.addColorStop(0, '#4CAF50')
      gradient.addColorStop(1, '#388E3C')
    } else {
      // 空闲工作台 - 使用普通灰色
      gradient.addColorStop(0, '#616161')
      gradient.addColorStop(1, '#424242')
    }
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(workshopRect.x, workshopRect.y, workshopRect.width, workshopRect.height)
    
    // 工作台边框 - 根据建造状态使用不同颜色
    this.ctx.strokeStyle = workshop.unlocked ? '#FFD700' : '#666666'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(workshopRect.x, workshopRect.y, workshopRect.width, workshopRect.height)
    
    // 工作台图标区域
    const iconSize = 40
    const iconX = workshopRect.x + 10
    const iconY = workshopRect.y + 10
    
    // 绘制工作台图标
    this.renderWorkshopIcon(workshop, iconX, iconY, iconSize, gameManager)
    
    // 工作台名称和等级
    this.ctx.fillStyle = workshop.unlocked ? '#FFFFFF' : '#AAAAAA'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`${workshop.name} Lv.${workshop.level}`, iconX + iconSize + 10, iconY + 20)
    
    // 生产状态或建造状态
    this.renderWorkshopStatus(workshop, iconX + iconSize + 10, iconY, dataManager, workshopRect)
    
    // 工作台统计信息 - 仅对已建造的工作台显示（整合显示，避免重复）
    if (workshop.unlocked) {
      this.ctx.fillStyle = '#FFD700'
      this.ctx.font = 'bold 14px Arial'
      this.ctx.fillText(`收益: ${gameManager.calculateIncome(workshop)}/次`, iconX + iconSize + 10, workshopRect.y + workshopRect.height - 35)
      
      this.ctx.fillStyle = '#E0E0E0'
      this.ctx.font = '12px Arial'
      this.ctx.fillText(`耗时: ${workshop.productionDuration / 1000}秒`, iconX + iconSize + 10, workshopRect.y + workshopRect.height - 20)
    }
    
    // 操作按钮区域
    this.renderWorkshopButtons(workshop, index, workshopRect, dataManager)
  }
  
  renderWorkshopIcon(workshop, iconX, iconY, iconSize, gameManager) {
    let iconKey = 'potionLab'
    let iconColor = '#8B4513'
    let iconText = '药水'
    
    switch(workshop.id) {
      case 'potion_lab':
        iconKey = 'potionLab'
        iconColor = '#8B4513'
        iconText = '药水'
        break
      case 'enchant_table':
        iconKey = 'enchantTable'
        iconColor = '#9C27B0'
        iconText = '附魔'
        break
      case 'crystal_forge':
        iconKey = 'crystalForge'
        iconColor = '#FF5722'
        iconText = '水晶'
        break
    }
    
    // 使用GameManager的drawImage方法来绘制图标
    const imageDrawn = gameManager.drawImage(iconKey, iconX, iconY, iconSize, iconSize, iconColor, iconText)
    
    // 如果图片绘制失败，添加边框
    if (!imageDrawn) {
      this.ctx.strokeStyle = '#FFFFFF'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(iconX, iconY, iconSize, iconSize)
    }
  }
  
  renderWorkshopStatus(workshop, x, y, dataManager, workshopRect) {
    this.ctx.font = '12px Arial'
    if (!workshop.unlocked) {
      // 未建造工作台
      this.ctx.fillStyle = '#FF9800'
      this.ctx.fillText('未建造', x, y + 40)
      
      // 显示解锁要求（增大字体）
      const requiredLevel = dataManager.getRequiredLevel ? dataManager.getRequiredLevel(workshop.id) : 1
      this.ctx.fillStyle = '#CCCCCC'
      this.ctx.font = '12px Arial'
      this.ctx.fillText(`需要等级: ${requiredLevel}`, x, y + 55)
    } else if (workshop.producing) {
      const currentTime = Date.now()
      const productionTime = currentTime - workshop.productionStartTime
      const progress = Math.min(1, productionTime / workshop.productionDuration)
      const remaining = Math.max(0, workshop.productionDuration - productionTime)
      
      this.ctx.fillStyle = '#00FF00'
      this.ctx.fillText(`生产中... ${Math.ceil(remaining / 1000)}秒`, x, y + 40)
      
      // 进度条移到工坊区域底部
      const progressBarWidth = 150
      const progressBarHeight = 6
      const progressBarX = x
      const progressBarY = workshopRect.y + workshopRect.height - 55  // 在底部收益信息上方
      
      // 进度条背景
      this.ctx.fillStyle = '#333333'
      this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条填充
      this.ctx.fillStyle = '#00FF00'
      this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
    } else {
      this.ctx.fillStyle = '#FFFF00'
      this.ctx.fillText('空闲中 - 点击开始生产', x, y + 40)
    }
  }
  
  renderWorkshopButtons(workshop, index, workshopRect, dataManager) {
    const buttonWidth = 60
    const buttonHeight = 25
    const buttonX = workshopRect.x + workshopRect.width - buttonWidth - 10
    
    if (!workshop.unlocked) {
      // 未建造工作台 - 显示建造按钮
      const buildButtonY = workshopRect.y + 30
      const buildButton = {
        x: buttonX,
        y: buildButtonY,
        width: buttonWidth,
        height: buttonHeight,
        type: 'build',
        workshopIndex: index
      }
      
      // 检查是否可以建造（等级要求）
      const requiredLevel = dataManager.getRequiredLevel ? dataManager.getRequiredLevel(workshop.id) : 1
      const currentLevel = dataManager.gameData.level
      const canBuild = currentLevel >= requiredLevel
      
      this.ctx.fillStyle = canBuild ? '#4CAF50' : '#757575'
      this.ctx.fillRect(buildButton.x, buildButton.y, buildButton.width, buildButton.height)
      this.ctx.strokeStyle = '#FFFFFF'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(buildButton.x, buildButton.y, buildButton.width, buildButton.height)
      
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(canBuild ? '建造' : '锁定', buildButton.x + buildButton.width / 2, buildButton.y + buildButton.height / 2 + 3)
      
      this.workshopButtons.push(buildButton)
    } else {
      // 已建造工作台 - 显示正常的操作按钮
      
      // 收集/开始按钮
      const actionButtonY = workshopRect.y + 15
      const actionButton = {
        x: buttonX,
        y: actionButtonY,
        width: buttonWidth,
        height: buttonHeight,
        type: 'action',
        workshopIndex: index
      }
      
      if (workshop.producing) {
        const currentTime = Date.now()
        const productionTime = currentTime - workshop.productionStartTime
        const canCollect = productionTime >= workshop.productionDuration
        
        this.ctx.fillStyle = canCollect ? '#4CAF50' : '#757575'
        this.ctx.fillRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
        
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = '12px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(canCollect ? '收集' : '生产中', actionButton.x + actionButton.width / 2, actionButton.y + actionButton.height / 2 + 3)
      } else {
        this.ctx.fillStyle = '#2196F3'
        this.ctx.fillRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
        
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = '12px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('开始', actionButton.x + actionButton.width / 2, actionButton.y + actionButton.height / 2 + 3)
      }
      
      // 升级按钮
      const upgradeButtonY = workshopRect.y + 45
      const upgradeButton = {
        x: buttonX,
        y: upgradeButtonY,
        width: buttonWidth,
        height: buttonHeight,
        type: 'upgrade',
        workshopIndex: index
      }
      
      const goldCost = workshop.upgradeGoldCost || (workshop.level * 100)
      const gemCost = workshop.upgradeGemCost || 0
      const canAfford = dataManager.getGold() >= goldCost && dataManager.getGems() >= gemCost
      
      this.ctx.fillStyle = canAfford ? '#FF9800' : '#757575'
      this.ctx.fillRect(upgradeButton.x, upgradeButton.y, upgradeButton.width, upgradeButton.height)
      this.ctx.strokeStyle = '#FFFFFF'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(upgradeButton.x, upgradeButton.y, upgradeButton.width, upgradeButton.height)
      
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('升级', upgradeButton.x + upgradeButton.width / 2, upgradeButton.y + upgradeButton.height / 2 + 3)
      
      // 显示升级费用详情（增大字体）
      this.ctx.fillStyle = canAfford ? '#FFD700' : '#CCCCCC'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'left'
      let costText = `💰${goldCost}`
      if (gemCost > 0) {
        costText += ` 💎${gemCost}`
      }
      this.ctx.fillText(costText, upgradeButton.x - 90, upgradeButton.y + 15)
      
      // 显示升级后的效果预览（增大字体，移动位置避免重叠）
      this.ctx.fillStyle = '#90EE90'
      this.ctx.font = '12px Arial'
      const nextLevelIncome = this.calculateUpgradeIncome(workshop)
      this.ctx.fillText(`->${nextLevelIncome}/次`, upgradeButton.x - 90, upgradeButton.y + 40)
      
      // 加速按钮（仅在生产中显示）
      if (workshop.producing) {
        const speedupButtonY = workshopRect.y + 75
        const speedupButton = {
          x: buttonX,
          y: speedupButtonY,
          width: buttonWidth,
          height: buttonHeight,
          type: 'speedup',
          workshopIndex: index
        }
        
        this.ctx.fillStyle = '#9C27B0'
        this.ctx.fillRect(speedupButton.x, speedupButton.y, speedupButton.width, speedupButton.height)
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(speedupButton.x, speedupButton.y, speedupButton.width, speedupButton.height)
        
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = '12px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('加速', speedupButton.x + speedupButton.width / 2, speedupButton.y + speedupButton.height / 2 + 3)
        
        this.workshopButtons.push(speedupButton)
      }
      
      this.workshopButtons.push(actionButton)
      this.workshopButtons.push(upgradeButton)
    }
  }
  
  renderCloseButton() {
    if (!this.closeButton) return
    
    UIUtils.drawRoundRect(this.ctx, this.closeButton, '#FF4444', 12)
    
    // 按钮文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('✖', this.closeButton.x + this.closeButton.width / 2, this.closeButton.y + this.closeButton.height / 2 + 5)
  }
  
  handleTouch(x, y, dataManager, gameManager, adManager) {
    if (!this.isVisible) return false
    
    // 检查关闭按钮
    if (this.closeButton && UIUtils.isPointInRect(x, y, this.closeButton)) {
      this.hide()
      return true
    }
    
    // 检查工作台按钮
    for (const button of this.workshopButtons) {
      if (UIUtils.isPointInRect(x, y, button)) {
        this.handleWorkshopButtonClick(button, dataManager, gameManager, adManager)
        return true
      }
    }
    
    return true // 阻止点击穿透
  }
  
  handleWorkshopButtonClick(button, dataManager, gameManager, adManager) {
    const workshop = dataManager.getWorkshops()[button.workshopIndex]
    
    switch (button.type) {
      case 'build':
        this.handleWorkshopBuild(workshop, button.workshopIndex, dataManager, gameManager)
        break
      case 'action':
        this.handleWorkshopAction(workshop, dataManager, gameManager)
        break
      case 'upgrade':
        gameManager.upgradeWorkshop(button.workshopIndex)
        break
      case 'speedup':
        this.handleWorkshopSpeedup(workshop, adManager, gameManager)
        break
    }
  }
  
  handleWorkshopBuild(workshop, index, dataManager, gameManager) {
    // 检查等级要求
    const requiredLevel = dataManager.getRequiredLevel ? dataManager.getRequiredLevel(workshop.id) : 1
    const currentLevel = dataManager.gameData.level
    
    if (currentLevel < requiredLevel) {
      console.log(`建造 ${workshop.name} 需要等级 ${requiredLevel}`)
      gameManager.createFloatingText(`需要等级 ${requiredLevel}`, gameManager.canvas.width / 2, gameManager.canvas.height / 2, '#FF0000')
      return
    }
    
    // 计算建造费用
    const buildCost = this.getWorkshopBuildCost(workshop.id)
    
    if (dataManager.getGold() < buildCost.gold || dataManager.getGems() < buildCost.gems) {
      console.log(`建造 ${workshop.name} 资源不足`)
      let message = '建造失败: '
      if (dataManager.getGold() < buildCost.gold) {
        message += `需要 ${buildCost.gold} 金币 `
      }
      if (dataManager.getGems() < buildCost.gems) {
        message += `需要 ${buildCost.gems} 宝石`
      }
      gameManager.createFloatingText(message, gameManager.canvas.width / 2, gameManager.canvas.height / 2, '#FF0000')
      return
    }
    
    // 扣除建造费用
    dataManager.spendGold(buildCost.gold)
    if (buildCost.gems > 0) {
      dataManager.spendGems(buildCost.gems)
    }
    
    // 建造工作台
    workshop.unlocked = true
    workshop.level = 1
    
    // 更新工作台属性
    gameManager.updateWorkshopStats(workshop)
    
    // 增加经验
    dataManager.addExp(20)
    
    // 创建建造特效
    gameManager.createFloatingText(`${workshop.name} 建造完成!`, gameManager.canvas.width / 2, gameManager.canvas.height / 2, '#00FF00', 18)
    
    // 保存数据
    dataManager.markDirty()
    
    console.log(`成功建造 ${workshop.name}`)
  }
  
  getWorkshopBuildCost(workshopId) {
    const costs = {
      'potion_lab': { gold: 0, gems: 0 },      // 药水实验室免费，默认解锁
      'enchant_table': { gold: 500, gems: 1 }, // 附魔台
      'crystal_forge': { gold: 2000, gems: 3 } // 水晶熔炉
    }
    return costs[workshopId] || { gold: 100, gems: 0 }
  }
  
  handleWorkshopAction(workshop, dataManager, gameManager) {
    if (workshop.producing) {
      // 检查是否可以收集
      const currentTime = Date.now()
      const productionTime = currentTime - workshop.productionStartTime
      const canCollect = productionTime >= workshop.productionDuration
      
      if (canCollect) {
        // 收集产品
        gameManager.completeProduction(workshop)
        console.log(`收集了 ${workshop.name} 的产品`)
      } else {
        console.log(`${workshop.name} 还在生产中，无法收集`)
      }
    } else {
      // 开始生产
      workshop.producing = true
      workshop.productionStartTime = Date.now()
      dataManager.markDirty()
      console.log(`开始 ${workshop.name} 的生产`)
    }
  }
  
  handleWorkshopSpeedup(workshop, adManager, gameManager) {
    // 检查微信API是否可用
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '加速生产',
        content: `观看广告可以立即完成 ${workshop.name} 的生产，是否继续？`,
        confirmText: '观看广告',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            adManager.showSpeedUpAd((success) => {
              if (success) {
                gameManager.completeProduction(workshop)
                console.log(`加速完成了 ${workshop.name} 的生产`)
              }
            })
          }
        }
      })
    } else {
      // fallback: 直接完成生产
      console.log('微信API不可用，直接完成生产')
      gameManager.completeProduction(workshop)
    }
  }
  
  // 计算升级后的收益
  calculateUpgradeIncome(workshop) {
    // 模拟升级后的工作台属性
    const upgradedWorkshop = {
      ...workshop,
      level: workshop.level + 1
    }
    
    // 使用GameManager的calculateIncome方法计算升级后收益
    if (this.gameManager && this.gameManager.calculateIncome) {
      return this.gameManager.calculateIncome(upgradedWorkshop)
    }
    
    // 如果GameManager不可用，使用简单的计算方式
    const baseIncome = workshop.baseIncome || 10
    const multiplier = 1.2 // 每级提升20%
    return Math.floor(baseIncome * Math.pow(multiplier, upgradedWorkshop.level))
  }
}
