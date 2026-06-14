-- ===========================================================================
-- 000003_blog.up.sql
-- 博客系统表：articles, tags, article_tags, comments, article_likes, comment_likes
-- 含种子数据：admin 用户 + 6 个标签 + 7 篇示例文章
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. articles（文章表）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    body        TEXT NOT NULL,
    summary     TEXT NOT NULL DEFAULT '',
    cover       TEXT,
    word_count  INT NOT NULL DEFAULT 0,
    view_count  INT NOT NULL DEFAULT 0,
    like_count  INT NOT NULL DEFAULT 0,
    published   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_user      ON articles(user_id);
CREATE INDEX idx_articles_slug      ON articles(slug);
CREATE INDEX idx_articles_published ON articles(published) WHERE published = true;
CREATE INDEX idx_articles_created   ON articles(created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. tags（标签表）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT UNIQUE NOT NULL,
    section     TEXT NOT NULL,          -- study | fun | life
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. article_tags（文章-标签中间表）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_tags (
    article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- 4. comments（评论表 — 自引用支持楼中楼）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    like_count  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_article   ON comments(article_id);
CREATE INDEX idx_comments_parent    ON comments(parent_id);
CREATE INDEX idx_comments_created   ON comments(created_at);

-- ---------------------------------------------------------------------------
-- 5. article_likes（文章点赞记录）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_likes (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

-- ---------------------------------------------------------------------------
-- 6. comment_likes（评论点赞记录）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comment_likes (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id  UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

-- ===========================================================================
-- 种子数据
-- ===========================================================================

-- --- 种子管理员用户 ---
INSERT INTO users (id, email, username, display_name, role, bio, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@xlab.local',
    'admin',
    'XLab 管理员',
    'admin',
    '默认管理员账户。可通过 Magic Link 登录（输入邮箱 admin@xlab.local），登录后可在后台管理所有内容。',
    NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- --- 种子标签（6 个，复用现有模块体系） ---
INSERT INTO tags (id, name, section) VALUES
    ('c0000000-0000-0000-0000-000000000001', '知识', 'study'),
    ('c0000000-0000-0000-0000-000000000002', '游戏', 'fun'),
    ('c0000000-0000-0000-0000-000000000003', '小说', 'fun'),
    ('c0000000-0000-0000-0000-000000000004', '电影', 'fun'),
    ('c0000000-0000-0000-0000-000000000005', '生活', 'life'),
    ('c0000000-0000-0000-0000-000000000006', '运动', 'life')
ON CONFLICT (id) DO NOTHING;

-- --- 种子示例文章（7 篇，覆盖全部 6 个标签） ---

-- 知识 × 2
INSERT INTO articles (id, user_id, title, slug, body, summary, word_count, published) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '曲线积分到底在积什么？',
    'knowledge-line-integral',
    '# 曲线积分到底在积什么？\n\n曲线积分不是玄学，它只是**沿着一条线做加法**。\n\n## 物理直觉\n\n想象你在一个力场中推着小车沿曲线走。把曲线切成无数小段，每一段上力和位移做点乘——把所有小段的功加起来，这就是第二类曲线积分。\n\n## 第一类 vs 第二类\n\n- **第一类（对弧长）**：积分对象是标量函数。物理意义：曲线的质量（如果线密度不均匀）。\n- **第二类（对坐标）**：积分对象是向量场。物理意义：力沿路径做的功。\n\n## 格林公式\n\n当路径闭合时，曲线积分可以转化为二重积分——这是格林公式的威力。它把边界上的量转化到内部区域上。\n\n> 数学不是记住公式，是理解"为什么要这样定义"。',
    '从"沿着曲线累加"理解第一类曲线积分，用物理直觉替代符号推导。',
    180,
    true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles (id, user_id, title, slug, body, summary, word_count, published) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '电路分析：基尔霍夫定律入门',
    'knowledge-kirchhoff',
    '# 电路分析：基尔霍夫定律入门\n\nKCL 和 KVL 是电路分析的两大基石。\n\n## KCL — 基尔霍夫电流定律\n\n**流入节点的电流 = 流出节点的电流。**\n\n本质是电荷守恒：电荷不会凭空消失或产生。在任意节点处，所有支路电流的代数和为零。\n\n## KVL — 基尔霍夫电压定律\n\n**任意闭合回路中，电压降的代数和为零。**\n\n本质是能量守恒：绕一圈回到出发点，电势不变。\n\n## 节点电压法\n\n1. 选定参考节点（地）\n2. 对每个非参考节点列 KCL 方程\n3. 用节点电压表示各支路电流\n4. 解方程组\n\n这是最实用的电路分析方法之一。',
    'KCL 和 KVL 是电路分析的两大基石，用直观方式理解节点电压法。',
    200,
    true
) ON CONFLICT (slug) DO NOTHING;

-- 游戏 × 1
INSERT INTO articles (id, user_id, title, slug, body, summary, word_count, published) VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    '黑神话：悟空 — 玩法深度体验',
    'game-black-myth',
    '# 黑神话：悟空 — 玩法深度体验\n\n从战斗系统到关卡设计，聊聊《黑神话：悟空》带来的惊喜与思考。\n\n## 战斗系统的精妙\n\n三段棍势 + 定身术 + 分身术的组合，让每一场 Boss 战都像在解谜。\n\n- **劈棍**：高伤害，适合 Boss 硬直窗口\n- **立棍**：防御反击，适合不熟悉敌人出招时\n- **戳棍**：远程消耗，安全但伤害较低\n\n三种棍势的切换时机决定战斗节奏。\n\n## 关卡设计\n\n线性与半开放世界的平衡做得很好。不会迷路，但也不会觉得被牵着走。每个章节都有独特的视觉主题——黄风岭的沙漠、紫云山的竹林、火焰山的熔岩。\n\n## 不足之处\n\n空气墙问题确实存在，有些看起来能跳过去的地方其实是透明的墙。希望后续更新能改善。',
    '从战斗系统到关卡设计，聊聊《黑神话：悟空》带来的惊喜与思考。',
    250,
    true
) ON CONFLICT (slug) DO NOTHING;

-- 小说 × 1
INSERT INTO articles (id, user_id, title, slug, body, summary, word_count, published) VALUES (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    '1984：语言与思想的牢笼',
    'novel-1984-review',
    '# 1984：语言与思想的牢笼\n\n奥威尔预言的极权世界，新话（Newspeak）对思维的塑造远超想象。\n\n## 新话的恐怖\n\n温斯顿的工作是修改历史记录——让过去与现在保持一致。但更深的控制来自语言本身：\n\n> 新话的目标是缩小思想的范围。最终，我们将使思想犯罪变得不可能——因为将没有词语来表达它。\n\n当语言被压缩到无法表达反抗的念头时，反抗本身就不再可能。这是奥威尔最深的洞见。\n\n## 双重思想\n\n同时相信两个矛盾的命题——这不仅仅是愚弄，而是一种日常的精神训练。\n\n> 战争即和平。自由即奴役。无知即力量。\n\n## 为什么今天还要读 1984\n\n不是因为它预言了未来，而是因为它揭示了权力如何通过语言运作。每一代人都在自己的语境里重新发现这本书的警告。',
    '奥威尔预言的极权世界，新话（Newspeak）对思维的塑造远超想象。',
    280,
    true
) ON CONFLICT (slug) DO NOTHING;

-- 电影 × 1
INSERT INTO articles (id, user_id, title, slug, body, summary, word_count, published) VALUES (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    '诺兰《奥本海默》— 成为死神',
    'movie-oppenheimer',
    '# 诺兰《奥本海默》— 成为死神\n\n诺兰用非线性的叙事，让观众亲历奥本海默的内心挣扎。这不是一部关于原子弹的电影，这是一部关于**后果**的电影。\n\n## 核爆场景\n\n沉默比爆炸更震耳。Trinity 试验那个著名的场景——倒计时结束，火焰升腾，然后：\n\n**没有声音。** 只有奥本海默的呼吸声。\n\n延迟的冲击波像是对观众的考验：你准备好了吗？准备好接受这个世界的改变了？\n\n## 双线叙事\n\n- **彩色 = 奥本海默的视角**：裂变（Fission），碎片式的记忆跳跃\n- **黑白 = 施特劳斯的视角**：聚变（Fusion），线性推进的政治阴谋\n\n两条线最终在听证会场景交汇——施特劳斯的倒台和奥本海默的安全许可撤销同步发生。\n\n## 那句台词\n\n> 我成了死神，世界的毁灭者。\n\n奥本海默引用《薄伽梵歌》的这句话，在电影中出现了两次。一次在 Trinity 成功的瞬间（得意），一次在安全听证会（悔恨）。同样的句子，完全不同的重量。',
    '诺兰用非线性的叙事让观众亲历奥本海默的内心挣扎，这是关于"后果"的电影。',
    320,
    true
) ON CONFLICT (slug) DO NOTHING;

-- 生活 × 1
INSERT INTO articles (id, user_id, title, slug, body, summary, word_count, published) VALUES (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    '宿舍好物推荐：住了三年总结的清单',
    'life-dorm-essentials',
    '# 宿舍好物推荐：住了三年总结的清单\n\n住了三年宿舍总结下来的实用好物，每件都经过实际使用验证。\n\n## 睡眠质量\n\n- **耳塞 + 眼罩**：宿舍睡眠质量的底线。推荐 3M 海绵耳塞，12 块一盒用半年。\n- **床帘**：创造私人空间，遮光效果比眼罩好。\n\n## 桌面收纳\n\n- **USB 排插**：每个床位至少需要 4 个充电口。推荐带 Type-C 快充的款式。\n- **桌面收纳盒**：分区放笔、数据线、文具。保持桌面干净是一种心理暗示——整洁的桌子让人更想学习。\n\n## 生活小物\n\n- **挂烫机**：比熨斗方便太多。衬衫挂上去喷蒸汽就平了。\n- **迷你加湿器**：北方冬天暖气房必备，USB 供电的就行。\n- **床边挂篮**：放手机、眼药水、充电宝，不用爬上爬下。',
    '住了三年宿舍总结下来的实用好物，每件都经过实际使用验证。',
    250,
    true
) ON CONFLICT (slug) DO NOTHING;

-- 运动 × 1
INSERT INTO articles (id, user_id, title, slug, body, summary, word_count, published) VALUES (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    '极限飞盘入门：从正手到弧线',
    'sport-frisbee-basics',
    '# 极限飞盘入门：从正手到弧线\n\n极限飞盘不是宠物游戏——它是一项结合了足球跑位、篮球传切和橄榄球达阵的团队运动。\n\n## 正手投掷（Forehand）\n\n这是最重要的基本功：\n\n1. 拇指压在盘面上方\n2. 食指沿边缘伸展\n3. 其余三指在盘底支撑\n4. 手腕发力，指尖拨动产生旋转\n\n**常见错误**：用手臂挥而不是手腕弹。旋转来自指尖的 snap，不是手臂的 swing。\n\n## 基本跑位：Stack 阵型\n\nStack 是所有战术的基础：\n\n- 全队在场地中央排成一列\n- 最前方的队员向一侧切出（cut），接盘\n- 如果没接到，回到队尾，下一个人切出\n\n**核心原则**：清空空间。每次只有一个人切出，给持盘人清晰的传球路线。\n\n## 防守基础\n\n- 持盘防守（Mark）：离持盘人一臂距离，喊出 stall count（1 到 10）\n- 切出防守：卡在接盘人和持盘人之间，看人不看盘\n\n> 飞盘的魅力在于：没有裁判，所有犯规由双方协商解决。这是对体育精神的终极信任。',
    '极限飞盘的正手投掷技巧和跑位意识，新人也能快速上手。',
    330,
    true
) ON CONFLICT (slug) DO NOTHING;

-- --- 标签关联（每篇文章打 1~2 个标签） ---
INSERT INTO article_tags (article_id, tag_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),   -- 曲线积分 → 知识
    ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),   -- 基尔霍夫 → 知识
    ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002'),   -- 黑神话 → 游戏
    ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003'),   -- 1984 → 小说
    ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004'),   -- 奥本海默 → 电影
    ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000005'),   -- 宿舍好物 → 生活
    ('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006')    -- 飞盘 → 运动
ON CONFLICT (article_id, tag_id) DO NOTHING;
