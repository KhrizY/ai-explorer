// === AI 探险号 — 课程页渲染器（顺序展开版）===

window.CoursePlayer = (function () {
  let course = null;
  let currentSection = 0;
  const container = document.getElementById('screen-container');

  function render(c) {
    course = c;
    currentSection = 0;
    container.innerHTML = '';
    window.scrollTo(0, 0);
    if (!course || !course.content) return;
    renderNextSection();
  }

  function renderNextSection() {
    if (currentSection >= course.content.length) return;
    const section = course.content[currentSection];
    const wrapper = document.createElement('div');
    wrapper.className = 'section-wrapper';
    wrapper.id = 'sec-' + currentSection;

    // 标题（带序号）
    if (section.heading) {
      const h = document.createElement('h3');
      h.className = 'section-heading';
      h.innerHTML = '<span class="section-num">' + (currentSection + 1) + '</span>' + section.heading;
      wrapper.appendChild(h);
    }

    // 渲染每个 block
    const body = document.createElement('div');
    body.className = 'section-body';

    // 兼容旧格式：paragraphs -> blocks type "p"
    let blocks = section.blocks;
    if (!blocks && section.paragraphs) {
      blocks = section.paragraphs.map(t => ({ type: 'p', text: t }));
    }
    // 兼容旧格式：顶层 interaction -> block type "tab-panel"
    if (section.interaction && section.interaction.type === 'tab-panel') {
      blocks = (blocks || []).concat([{ type: 'tab-panel', tabs: section.interaction.tabs }]);
    }

    if (blocks) {
      blocks.forEach((block, bi) => {
        const el = renderBlock(block, currentSection, bi);
        if (el) body.appendChild(el);
      });
    }

    wrapper.appendChild(body);

    // 名词徽章（inline terms already handled in paragraphs）
    if (section.terms && Object.keys(section.terms).length > 0) {
      const termsDiv = document.createElement('div');
      termsDiv.className = 'section-terms-inline';
      const title = document.createElement('span');
      title.className = 'terms-inline-title';
      title.textContent = '📖 ';
      termsDiv.appendChild(title);
      Object.entries(section.terms).forEach(([term, def]) => {
        const badge = document.createElement('span');
        badge.className = 'term-badge-inline';
        badge.textContent = term;
        badge.title = def;
        badge.addEventListener('click', function(e) {
          e.stopPropagation();
          showTermBubble(term, def);
        });
        termsDiv.appendChild(badge);
      });
      wrapper.appendChild(termsDiv);
    }

    // 继续按钮
    if (currentSection < course.content.length - 1) {
      const nextBtn = document.createElement('div');
      nextBtn.className = 'section-next-wrap';
      const btn = document.createElement('button');
      btn.className = 'section-next-btn';
      btn.textContent = section.nextHint || '继续学习 →';
      btn.addEventListener('click', function() {
        currentSection++;
        renderNextSection();
      });
      nextBtn.appendChild(btn);
      wrapper.appendChild(nextBtn);
    } else {
      // 最后一节——完成提示
      const done = document.createElement('div');
      done.className = 'course-done';
      done.innerHTML = '<span class="done-check">✅</span> 本课已全部学完，<a href="javascript:goHome()">返回首页</a>';
      wrapper.appendChild(done);
    }

    container.appendChild(wrapper);
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ========== Block 渲染器 ==========

  function renderBlock(block, si, bi) {
    switch (block.type) {
      case 'p': return renderParagraph(block, si, bi);
      case 'expert-tree': return renderExpertTree(block);
      case 'blackbox': return renderBlackBox(block);
      case 'tab-panel': return renderTabPanel(block);
      case 'card-row': return renderCardRow(block);
      case 'process-flow': return renderProcessFlow(block);
      case 'word-attention': return renderWordAttention(block);
      default: {
        const el = document.createElement('div');
        el.className = 'block-p';
        el.textContent = block.text || '';
        return el;
      }
    }
  }

  // ========== 段落 + inline 关键词 ==========

  function renderParagraph(block, si, bi) {
    const el = document.createElement('div');
    el.className = 'block-p';

    let text = block.text || '';
    // 解析 [[term]] -> clickable term badge
    const regex = /\[\[([^\]]+)\]\]/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ type: 'text', text: text.slice(lastIdx, match.index) });
      }
      const term = match[1];
      // 从 course.terms 中找定义
      const def = course.terms ? (course.terms[term] || term) : term;
      parts.push({ type: 'term', text: term, def: def });
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < text.length) {
      parts.push({ type: 'text', text: text.slice(lastIdx) });
    }

    parts.forEach(part => {
      if (part.type === 'text') {
        // 检测 URL 并转为链接
        const urlRegex = /(https?:\/\/[^\s，。！？、]+)/g;
        let textPart = part.text;
        let lastUrlIdx = 0;
        let urlMatch;
        while ((urlMatch = urlRegex.exec(textPart)) !== null) {
          if (urlMatch.index > lastUrlIdx) {
            const s = document.createElement('span');
            s.textContent = textPart.slice(lastUrlIdx, urlMatch.index);
            el.appendChild(s);
          }
          const a = document.createElement('a');
          a.href = urlMatch[0];
          a.textContent = urlMatch[0];
          a.target = '_blank';
          a.className = 'inline-link';
          el.appendChild(a);
          lastUrlIdx = urlRegex.lastIndex;
        }
        if (lastUrlIdx < textPart.length) {
          const s = document.createElement('span');
          s.textContent = textPart.slice(lastUrlIdx);
          el.appendChild(s);
        }
      } else {
        const badge = document.createElement('span');
        badge.className = 'term-inline';
        badge.textContent = part.text;
        badge.title = part.def;
        if (!sessionStorage.getItem('ai-term-hint')) {
          badge.classList.add('hint-finger');
        }
        badge.addEventListener('click', function(e) {
          e.stopPropagation();
          showTermBubble(part.text, part.def);
          dismissTermHints();
        });
        el.appendChild(badge);
      }
    });

    return el;
  }

  // ========== 专家系统决策树（SVG版） ==========

  function renderExpertTree(block) {
    const el = document.createElement('div');
    el.className = 'expert-tree-wrap';

    const title = document.createElement('div');
    title.className = 'expert-tree-title';
    title.textContent = '👆 ' + block.title;
    el.appendChild(title);

    // 构建节点关系
    const root = block.nodes.find(n => !n.parent);
    const childrenMap = {};
    block.nodes.forEach(n => {
      if (n.parent) {
        if (!childrenMap[n.parent]) childrenMap[n.parent] = [];
        childrenMap[n.parent].push(n);
      }
    });

    const treeHTML = buildTreeHTML(root, childrenMap, 0);
    const treeView = document.createElement('div');
    treeView.className = 'expert-tree-view';
    treeView.innerHTML = treeHTML;
    el.appendChild(treeView);

    // 绑定点击事件
    treeView.querySelectorAll('.et-condition').forEach(btn => {
      btn.addEventListener('click', function() {
        const target = treeView.querySelector('#etc-' + this.dataset.tid);
        if (target) {
          target.classList.toggle('et-hidden');
          this.classList.toggle('et-open');
        }
      });
    });

    return el;
  }

  function buildTreeHTML(node, childrenMap, depth) {
    const indent = depth * 20;
    const children = childrenMap[node.id] || [];

    if (node.kind === 'output') {
      return '<div class="et-node" style="margin-left:' + indent + 'px"><span class="et-tag et-output">' + node.label + '</span></div>';
    }

    if (node.kind === 'start') {
      let html = '<div class="et-node" style="margin-left:' + indent + 'px"><span class="et-tag et-start">▶ ' + node.label + '</span></div>';
      children.forEach(child => {
        html += buildTreeHTML(child, childrenMap, depth + 1);
      });
      return html;
    }

    if (node.kind === 'condition') {
      const childBlocks = children.map(child => buildTreeHTML(child, childrenMap, depth + 1)).join('');
      return `
        <div class="et-node" style="margin-left:${indent}px">
          <span class="et-tag et-condition" data-tid="${node.id}">？ ${node.label}</span>
        </div>
        <div class="et-children et-hidden" id="etc-${node.id}" style="margin-left:${indent + 16}px">
          ${childBlocks}
        </div>
      `;
    }

    return '';
  }

  // ========== 卡片行 ==========

  function renderCardRow(block) {
    const el = document.createElement('div');
    el.className = 'card-row' + (block.expandable ? ' card-row-expandable' : '');
    (block.cards || []).forEach((card, i) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card-row-item';
      if (block.expandable && card.expand && !sessionStorage.getItem('ai-card-hint')) {
        cardEl.classList.add('hint-finger');
      }
      cardEl.innerHTML = `
        <div class="card-row-emoji">${card.emoji}</div>
        <div class="card-row-title">${card.title}</div>
        <div class="card-row-desc">${card.desc}</div>
        ${card.expand ? '<div class="card-row-expand"><div class="card-expand-text">' + card.expand + '</div></div>' : ''}
        ${card.expand ? '<div class="card-row-hint">点击查看详情</div>' : ''}
      `;
      if (card.expand) {
        cardEl.addEventListener('click', function() { cardEl.classList.toggle('expanded'); dismissCardHints(); });
      }
      el.appendChild(cardEl);
    });
    return el;
  }

  // ========== 训练流程图 ==========

  function renderProcessFlow(block) {
    const el = document.createElement('div');
    el.className = 'process-flow-wrap';

    if (block.title) {
      const t = document.createElement('div');
      t.className = 'pf-title';
      t.textContent = block.title;
      el.appendChild(t);
    }

    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'pf-steps';

    (block.steps || []).forEach((step, i) => {
      const stepEl = document.createElement('div');
      stepEl.className = 'pf-step';

      // 圆形图标
      const iconWrap = document.createElement('div');
      iconWrap.className = 'pf-step-icon-wrap';
      const icon = document.createElement('div');
      icon.className = 'pf-step-icon';
      icon.innerHTML = step.icon;
      const num = document.createElement('span');
      num.className = 'pf-step-num';
      num.textContent = (i + 1);
      iconWrap.appendChild(icon);
      iconWrap.appendChild(num);

      // 内容
      const content = document.createElement('div');
      content.className = 'pf-step-content';
      const label = document.createElement('div');
      label.className = 'pf-step-label';
      label.textContent = step.label;
      const short = document.createElement('div');
      short.className = 'pf-step-short';
      short.textContent = step.short;

      // 详情（默认隐藏）
      const detail = document.createElement('div');
      detail.className = 'pf-step-detail';
      detail.textContent = step.detail;

      content.appendChild(label);
      content.appendChild(short);
      content.appendChild(detail);

      stepEl.appendChild(iconWrap);
      stepEl.appendChild(content);

      // 点击展开详情
      stepEl.addEventListener('click', function(e) {
        const wasActive = stepEl.classList.contains('active');
        // 关闭所有
        stepsContainer.querySelectorAll('.pf-step.active').forEach(s => s.classList.remove('active'));
        if (!wasActive) stepEl.classList.add('active');
      });

      stepsContainer.appendChild(stepEl);

      // 连接线
      if (i < block.steps.length - 1) {
        const conn = document.createElement('div');
        conn.className = 'pf-connector';
        stepsContainer.appendChild(conn);
      }
    });

    el.appendChild(stepsContainer);
    return el;
  }

  // ========== 黑箱动画（重写） ==========

  function renderBlackBox(block) {
    const el = document.createElement('div');
    el.className = 'blackbox-wrap';

    // 左侧输入区
    const left = document.createElement('div');
    left.className = 'bbox-left';
    const leftTitle = document.createElement('div');
    leftTitle.className = 'bbox-label-top';
    leftTitle.textContent = '输入：大量带标签的数据';
    left.appendChild(leftTitle);
    const inputGrid = document.createElement('div');
    inputGrid.className = 'bbox-input-grid';
    block.inputs.forEach(inp => {
      const card = document.createElement('div');
      card.className = 'bbox-input-card';
      card.innerHTML = '<span class="bbox-emoji">' + inp.emoji + '</span><span class="bbox-label">' + inp.label + '</span>';
      inputGrid.appendChild(card);
    });
    left.appendChild(inputGrid);

    // 中间黑箱
    const middle = document.createElement('div');
    middle.className = 'bbox-middle';
    middle.innerHTML = `
      <div class="bbox-box" id="bbox-trigger">
        <div class="bbox-gears">⚙️</div>
        <div class="bbox-box-label">训练过程</div>
      </div>
      <div class="bbox-arrow-big">→</div>
    `;

    // 右侧输出
    const right = document.createElement('div');
    right.className = 'bbox-right';
    const rightTitle = document.createElement('div');
    rightTitle.className = 'bbox-label-top';
    rightTitle.textContent = '输出：训练好的模型';
    right.appendChild(rightTitle);
    const output = document.createElement('div');
    output.className = 'bbox-output';
    output.textContent = block.outputLabel;
    right.appendChild(output);

    // 提示
    const hint = document.createElement('div');
    hint.className = 'bbox-hint';
    hint.textContent = '👆 点击中间的箱子看看训练过程';

    el.appendChild(left);
    el.appendChild(middle);
    el.appendChild(right);
    el.appendChild(hint);

    // 动画绑定
    const trigger = middle.querySelector('#bbox-trigger');
    trigger.addEventListener('click', function() {
      if (trigger.classList.contains('played')) return;
      trigger.classList.add('played');

      // 卡片逐个飞入
      const cards = left.querySelectorAll('.bbox-input-card');
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('flying'), i * 100);
      });

      // 黑箱处理动画
      setTimeout(() => {
        trigger.classList.add('processing');
        const gears = trigger.querySelector('.bbox-gears');
        if (gears) gears.style.animation = 'gearSpin 0.6s linear infinite';
      }, cards.length * 100 + 200);

      // 输出结果
      setTimeout(() => {
        trigger.classList.remove('processing');
        trigger.classList.add('done');
        const gears = trigger.querySelector('.bbox-gears');
        if (gears) gears.style.animation = 'none';
        output.classList.add('show');
      }, cards.length * 100 + 1400);
    });

    return el;
  }

  // ========== Tab 面板 ==========

  function renderTabPanel(block) {
    const el = document.createElement('div');
    el.className = 'tab-panel-wrap';

    const nav = document.createElement('div');
    nav.className = 'tab-nav';
    block.tabs.forEach((t, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
      btn.textContent = t.emoji + ' ' + t.label;
      btn.addEventListener('click', function() {
        nav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const content = el.querySelector('.tab-content');
        if (content) {
          content.innerHTML = renderTabInner(t);
        }
      });
      nav.appendChild(btn);
    });

    const content = document.createElement('div');
    content.className = 'tab-content';
    content.innerHTML = renderTabInner(block.tabs[0]);

    el.appendChild(nav);
    el.appendChild(content);
    return el;
  }

  function renderTabInner(tab) {
    let html = '<div class="tab-desc">' + tab.desc + '</div>';
    if (tab.blocks) {
      tab.blocks.forEach(b => {
        html += '<div class="tab-block"><h4>' + b.title + '</h4><p>' + b.text.replace(/\n/g, '<br>') + '</p></div>';
      });
    }
    return html;
  }

  // ========== 名词气泡弹窗 ==========

  function showTermBubble(term, def) {
    ensureBubbleElements();
    const overlay = document.getElementById('term-bubble-overlay');
    const popup = document.getElementById('term-bubble-popup');
    popup.innerHTML = `
      <div class="bubble-term-name">${term}</div>
      <div class="bubble-term-def">${def}</div>
      <button class="bubble-close" onclick="window.CoursePlayer.hideTermBubble()">✕</button>
    `;
    overlay.classList.add('visible');
    popup.classList.add('visible');
  }

  function hideTermBubble() {
    const o = document.getElementById('term-bubble-overlay');
    const p = document.getElementById('term-bubble-popup');
    if (o) o.classList.remove('visible');
    if (p) p.classList.remove('visible');
  }

  function ensureBubbleElements() {
    if (!document.getElementById('term-bubble-overlay')) {
      const ov = document.createElement('div');
      ov.id = 'term-bubble-overlay';
      ov.className = 'term-bubble-overlay';
      ov.onclick = hideTermBubble;
      document.body.appendChild(ov);
      const pp = document.createElement('div');
      pp.id = 'term-bubble-popup';
      pp.className = 'term-bubble-popup';
      document.body.appendChild(pp);
    }
  }

  // ========== 词注意力可视化 ==========

  function renderWordAttention(block) {
    const el = document.createElement('div');
    el.className = 'word-attention-wrap';

    if (block.title) {
      const t = document.createElement('div');
      t.className = 'wa-title';
      t.textContent = '👆 ' + block.title;
      el.appendChild(t);
    }

    const sentenceDiv = document.createElement('div');
    sentenceDiv.className = 'wa-sentence';

    const words = block.sentence || [];
    const attention = block.attention || {};

    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'wa-badges';

    words.forEach((word, i) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'wa-word';
      wordEl.textContent = word;
      wordEl.dataset.idx = i;

      wordEl.addEventListener('click', function() {
        // 移除所有活跃状态
        sentenceDiv.querySelectorAll('.wa-word.active').forEach(w => w.classList.remove('active'));
        wordEl.classList.add('active');

        // 显示这个词的关注目标
        const targets = attention[String(i)] || [];
        badgesDiv.innerHTML = targets.map(t =>
          '<span class="wa-badge">🡒 <b>' + words[t.target] + '</b>：' + t.label + '</span>'
        ).join('');
      });

      sentenceDiv.appendChild(wordEl);
    });

    el.appendChild(sentenceDiv);
    el.appendChild(badgesDiv);

    // 默认点击第一个词
    setTimeout(() => { sentenceDiv.querySelector('.wa-word')?.click(); }, 100);

    return el;
  }

  function dismissTermHints() {
    sessionStorage.setItem('ai-term-hint', '1');
    document.querySelectorAll('.term-inline.hint-finger').forEach(el => el.classList.remove('hint-finger'));
  }

  function dismissCardHints() {
    sessionStorage.setItem('ai-card-hint', '1');
    document.querySelectorAll('.card-row-item.hint-finger').forEach(el => el.classList.remove('hint-finger'));
  }

  return { render, hideTermBubble, showTermBubble };
})();
