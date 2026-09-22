# PakSeekers — Design System

## 1. Purpose

The PakSeekers Design System establishes a consistent visual language across the platform.

All future interfaces must use this system unless there is a documented reason to deviate.

---

## 2. Brand Personality

PakSeekers should communicate:

* Trust
* Intelligence
* Education
* Focus
* Progress
* Motivation
* Professionalism

The product should feel like a modern EdTech platform.

---

## 3. Color Tokens

### Brand

```text
Primary:   #123B63
Secondary: #0F766E
Accent:    #F59E0B
```

### Background

```text
Background: #F8FAFC
Surface:    #FFFFFF
```

### Text

```text
Primary:   #172033
Secondary: #64748B
```

### Border

```text
Default: #E2E8F0
```

### Semantic

```text
Success:  #16A34A
Error:    #DC2626
Warning:  #F59E0B
Disabled: #94A3B8
```

---

## 4. Color Meaning

```text
Navy
→ Brand
→ Primary actions
→ Trust
→ Academic credibility

Teal
→ Learning
→ Progress
→ Secondary actions

Amber
→ Attention
→ Important actions
→ Needs improvement

Green
→ Success
→ Correct
→ Completed

Red
→ Error
→ Incorrect
→ Critical state
```

Color should communicate meaning rather than serve as decoration.

---

## 5. Typography

Use a clean modern sans-serif font.

Typography hierarchy should be consistent:

```text
Page Title
Section Heading
Card Heading
Body
Secondary Text
Caption
```

Do not use multiple unrelated fonts.

---

## 6. Buttons

Primary button:

```text
Navy background
White text
```

Secondary button:

```text
Teal treatment
```

Important action:

```text
Amber
```

Danger:

```text
Red
```

Secondary/neutral:

```text
White/neutral
Border
```

Buttons should clearly communicate hierarchy.

---

## 7. Cards

Cards should use:

```text
White background
Subtle border
Moderate radius
Minimal shadow
```

Avoid excessive floating cards.

---

## 8. Forms

Forms should have:

* Clear labels
* Helpful placeholders
* Validation messages
* Required-field indicators
* Loading states
* Disabled states

Inputs should have clear focus states.

---

## 9. Tables

Admin tables should prioritize information density and readability.

Use:

* Clear headers
* Consistent spacing
* Status badges
* Search
* Filters
* Pagination where necessary

Do not use excessive colors inside tables.

---

## 10. Status Badges

Use semantic colors.

```text
Published → Green
Draft → Neutral
Review → Amber
Archived → Gray
Error → Red
```

---

## 11. Spacing

Use a consistent spacing scale.

Do not arbitrarily choose different margins and padding values for every component.

---

## 12. Border Radius

Use moderate rounding.

Avoid:

* Completely square interfaces
* Excessive pill-shaped components
* Excessively rounded cards

Pills should primarily be used for badges/status indicators.

---

## 13. Shadows

Use shadows sparingly.

The interface should primarily use:

```text
Surface
+
Border
+
Spacing
```

rather than heavy shadows.

---

## 14. Animation

Animations should be subtle and functional.

Use animation for:

* Navigation
* Modal transitions
* Loading states
* Feedback

Avoid decorative animation.

---

## 15. Admin Interface

The admin interface should prioritize:

1. Information clarity
2. Efficient navigation
3. Content management
4. Search/filtering
5. Data visibility

The admin panel should not look like a marketing landing page.

---

## 16. Student Interface

The future student interface should prioritize:

1. Focus
2. Readability
3. Learning
4. Progress
5. Minimal distraction

---

## 17. Responsive Design

Desktop is the primary environment for the admin panel.

However, components must remain usable on:

* Laptop
* Tablet
* Mobile

Student-facing interfaces should be designed mobile-first where appropriate.

---

## 18. Design Principle

The core rule is:

**Color, spacing, typography, and interaction should establish hierarchy rather than decoration.**

PakSeekers should remain visually recognizable even as new modules are added.
