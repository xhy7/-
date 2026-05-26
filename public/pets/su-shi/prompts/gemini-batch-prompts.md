# 苏轼桌宠帧图生成 Prompt（Gemini）

> 除 idle、greet 外全部重新生成。**每个状态统一 6 帧。**

---

## 📎 第一步：上传参考图

先上传 `preview.png` 或现有 `idle-01.png` / `greet-01.png` 作为 reference，然后粘贴下方对应状态的 prompt。

---

## 🎨 统一角色设定（所有状态共用）

```
Q-version chibi character: Su Shi (苏轼), Song Dynasty poet.

MUST match the reference image exactly:
- Large round head, big warm brown eyes, thick arched eyebrows
- Black futou hat (乌纱帽) with two trailing ribbons
- Small black goatee and short beard
- White flowing robe with wide sleeves, dark blue sash at waist
- Cute chibi proportions: large head, small body, soft rounded lines
- Flat 2D illustration style, clean vector-like edges, soft pastel shading

Global requirements for ALL frames:
- Transparent background (PNG)
- Character centered, full body visible
- No text, no watermark, no signature
- Same art style, same color palette, same proportions across all frames
- 128x128 px square canvas, character fills ~80% of frame
```

---

## 🗣️ TALK（说话）— 6 帧，循环

**嘴部张合 + 手部微动，表情逐渐热情：**

```
Generate 6 frames of Su Shi in TALK state for looping animation.

Frame 1 (talk-01): Mouth closed, gentle smile. One hand resting at side. Neutral listening pose.
Frame 2 (talk-02): Mouth slightly open (starting to speak). Same hand rising to chest. Eyes brightening.
Frame 3 (talk-03): Mouth half open (mid-syllable). Hand at chest, palm up in gentle gesture. Engaged expression.
Frame 4 (talk-04): Mouth wide open (emphatic speech). Hand raised higher, finger pointing slightly. Animated eyebrows.
Frame 5 (talk-05): Mouth half open (continuing). Hand lowering back to chest. Warm active expression.
Frame 6 (talk-06): Mouth closed in content smile. Hand back at side. Satisfied nodding posture.

Loop sequence: 1→2→3→4→5→6→1...
Keep body position stable. Only mouth, hand, and eyebrow change.
```

---

## 📜 POEM（吟诗）— 6 帧，一次性

**仰头 → 陶醉 → 回落，扇子全程参与：**

```
Generate 6 frames of Su Shi in POEM state for one-shot animation (plays once then returns to idle).

Frame 1 (poem-01): Standing calmly, folding fan closed in right hand at side. Gentle smile, looking straight ahead.
Frame 2 (poem-02): Head tilting up ~10 degrees. Starting to open fan slowly. Eyes softening, looking upward.
Frame 3 (poem-03): Head tilted up ~25 degrees. Fan half-open, held near chest. Eyes half-closed, dreamy expression beginning.
Frame 4 (poem-04): Head fully tilted up ~40 degrees. Fan fully open, held up gracefully near face. Eyes nearly closed in deep poetic reverie. Peak dramatic pose.
Frame 5 (poem-05): Head lowering to ~20 degrees. Fan starting to close. Eyes half-opening, a satisfied smile forming.
Frame 6 (poem-06): Head back to normal. Fan closed at side. Eyes open, peaceful content expression. Gentle satisfied smile.

Smooth elegant arc. Most dramatic frame is 04. Most serene is 06.
```

---

## ✋ DRAGGING（被拖拽）— 6 帧，循环

**左右惊慌挣扎，帽子飘带飞扬：**

```
Generate 6 frames of Su Shi in DRAGGING state for looping panic animation.

Frame 1 (dragging-01): Centered, slightly alarmed. Eyes widening. Arms just starting to lift.
Frame 2 (dragging-02): Pulled left, body leaning right. Arms flailing up. Mouth open in surprise. Hat tilting left.
Frame 3 (dragging-03): Pulled further left, more lean. Arms higher flail. Eyes wide. Robe fluttering right.
Frame 4 (dragging-04): Centered again, recovering. Blinking in confusion. Arms half-lowered.
Frame 5 (dragging-05): Pulled right, body leaning left. Arms flailing up again. Same panicked expression. Hat tilting right.
Frame 6 (dragging-06): Pulled further right, more lean. Arms highest flail. Most dramatic panic. Robe fluttering left.

Loop sequence: 1→2→3→4→5→6→1...
Keep it comedic and cute despite distress. Exaggerated motion.
```

---

## 😄 HAPPY（开心）— 6 帧，一次性

**预备 → 起跳 → 顶点 → 悬浮 → 下落 → 落地：**

```
Generate 6 frames of Su Shi in HAPPY state for one-shot jumping celebration.

Frame 1 (happy-01): On ground, crouching low preparing to jump. Big grin forming. Arms down, coiled energy.
Frame 2 (happy-02): Pushing off ground, starting to rise. Arms swinging up. Eyes sparkling open, huge smile.
Frame 3 (happy-03): At jump peak, mid-air. Both arms raised high. Eyes squeezed into happy crescents (closed-eye smile). Mouth wide open in joy. Robe and ribbons floating.
Frame 4 (happy-04): Still at peak, arms waving enthusiastically. Same closed-eye happy grin. Slight secondary bounce feel.
Frame 5 (happy-05): Starting to descend. Arms still raised but lowering slightly. Eyes opening, still grinning.
Frame 6 (happy-06): Landed back on ground, slight knee bend from impact. Arms at sides but posture bouncy. Eyes open, sparkling with residual joy.

Most energetic frames: 03, 04. Smooth arc from ground → air → ground.
```

---

## 😤 ANNOYED（生气）— 6 帧，一次性

**疑惑 → 不爽 → 抱臂 → 扭头 → 偷瞄 → 缓和：**

```
Generate 6 frames of Su Shi in ANNOYED state for one-shot grumpy reaction.

Frame 1 (annoyed-01): Mild confusion. One eyebrow raised, one normal. Arms at side. Head tilted. "What?" expression.
Frame 2 (annoyed-02): Growing irritation. Both eyebrows starting to furrow. Arms beginning to cross. Mouth forming small pout.
Frame 3 (annoyed-03): Full annoyed pose. Arms firmly crossed. Eyebrows deeply furrowed. Eyes narrowed. Pout deepened. "Hmph!"
Frame 4 (annoyed-04): Turning away ~30 degrees. Arms still crossed. Looking back over shoulder with dismissive side-eye. Mouth still pouting.
Frame 5 (annoyed-05): Turned further ~45 degrees. Arms still crossed. Sneaking a peek back. One eye visible, still annoyed but curiosity poking through.
Frame 6 (annoyed-06): Turning back toward front. Arms uncrossing slightly. Expression softening into reluctant acceptance. Tiny almost-smile trying to hide.

Playful grumpiness, not real anger. Chibi cute throughout.
```

---

## 😴 SLEEP（睡觉）— 6 帧，循环

**呼吸起伏 + 头部轻摇 + Zzz 漂浮：**

```
Generate 6 frames of Su Shi in SLEEP state for looping sleep animation.

Frame 1 (sleep-01): Sleeping, head drooped slightly left. Eyes closed, gentle smile. Body relaxed. Small "z" near head.
Frame 2 (sleep-02): Head drooped more left. Eyes still closed. Slight inhale (chest slightly puffed). "z" moved slightly up.
Frame 3 (sleep-03): Head at maximum left droop. Deepest sleep pose. "z" duplicated to "zZ" floating higher.
Frame 4 (sleep-04): Head starting to drift right. Eyes still closed. Exhale (chest normal). Single "z" again, lower position.
Frame 5 (sleep-05): Head drooped right. Same peaceful expression. "z" drifting right slightly.
Frame 6 (sleep-06): Head at maximum right droop. Deep sleep. "zZ" floating again. Slight content smile.

Loop sequence: 1→2→3→4→5→6→1...
Very slow, calming motion. Minimal head movement (~10 degrees max swing).
```

---

## 📋 生成检查清单

每生成一组后确认：
- [ ] 6 帧角色外观完全一致（脸型、帽子、服饰、颜色、光影）
- [ ] 透明背景，无文字水印
- [ ] 帧间过渡自然，动作流畅连贯
- [ ] 尺寸比例合适（128x128 画布，角色占 ~80%）
- [ ] 循环/一次性标注正确

---

## 📁 输出命名

生成后按此命名保存：
```
talk/talk-01.png ~ talk-06.png
poem/poem-01.png ~ poem-06.png
dragging/dragging-01.png ~ dragging-06.png
happy/happy-01.png ~ happy-06.png
annoyed/annoyed-01.png ~ annoyed-06.png
sleep/sleep-01.png ~ sleep-06.png
```
