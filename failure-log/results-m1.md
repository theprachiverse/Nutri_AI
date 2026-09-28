# Failure Log — Milestone 1

Run date: 2026-09-28
Model: openai/gpt-oss-120b

| Q# | Question | Failure Type | Description |
|:---|:---------|:-------------|:------------|
| 3 | How much protein does a sedentary vegetarian adult need daily? | Drifting number | Run 1 claims a 60kg adult needs 55-60g; Run 2 claims a 70kg adult needs 55-60g. |
| 8 | Is coffee good or bad for your health overall? | Hedged into uselessness | Gives generic pros/cons and concludes with "personal tolerance varies, so listening to your body is key" without a definitive stance. |
| 9 | Are artificial sweeteners harmful in moderate amounts? | Hedged into uselessness | States they are FDA approved but hedges heavily with "evidence is not definitive" and "talk to a doctor." |
| 10 | Is eating red meat a few times a week harmful long-term? | Drifting number | Run 1 defines moderate intake as <=4 servings/week; Run 2 defines it as 2-3 servings/week. |

## Failure Counts
- Claims stated as fact with no backing: 0
- Numbers that shifted between runs: 2
- Sources cited that cannot be found: 0
- Questions that should have been declined: 0
- Questions where it hedged into uselessness: 2
