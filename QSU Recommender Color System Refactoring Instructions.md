# QSU Recommender — Color System Refactoring Instructions

## Objective

Recolor the entire QSU Recommender web application so that all pages follow one consistent institutional visual identity based on the QSU emblem.

The goal is **not to redesign the UI or change layouts**. Keep the existing components, spacing, typography, functionality, navigation, and page structure. Only improve and standardize the color system.

The application must support both **Light Mode and Dark Mode**.

---

## 1. Core Brand Colors

Use these as the application's primary brand colors:

```text
Primary Green: #159447
Gold Accent:   #D9A62E
White:         #FFFFFF
```

These are the only three **brand colors**.

Do not introduce unrelated blue, purple, cyan, pink, or arbitrary gray-green colors into normal UI components.

Shades and tints derived from the three brand colors are allowed.

---

# 2. Light Theme

Use a clean institutional appearance.

```text
Background:        #FFFFFF
Surface/Card:      #FFFFFF
Muted Surface:     #F3F9F5

Primary Green:     #159447
Primary Hover:     #08752F
Primary Light:     #E5F4EA

Border:            #B9DFC7

Gold:              #D9A62E
Gold Light:        #F8EBC4

Primary Text:      #17321F
Secondary Text:    #557061
Muted Text:        #718579
```

### Light-mode rules

- Page background should remain predominantly white.
- Cards should use white backgrounds.
- Use very pale green only for selected/active surfaces.
- Use green for primary actions and navigation.
- Use gold sparingly for highlights and priority indicators.
- Do not use blue or purple for normal UI elements.
- Avoid excessive pale-green backgrounds.

---

# 3. Dark Theme

Use a dark green institutional theme.

```text
Background:        #081A10
Surface/Card:      #0F281A
Surface Elevated:  #12351F

Primary Green:     #159447
Primary Hover:     #1FA95A
Primary Light:     #1B5737

Border:            #1B5737

Gold:              #D9A62E
Gold Light:        #F2C94C

Primary Text:      #FFFFFF
Secondary Text:    #A9BCAF
Muted Text:        #7F9989
```

### Dark-mode rules

- Never use pure black backgrounds.
- Use dark green instead.
- Cards should be slightly lighter than the page background.
- Primary buttons should use `#159447`.
- Gold should remain visible but limited.
- White should primarily be used for important text.
- Avoid large gray surfaces.
- Do not introduce blue/purple UI elements.

---

# 4. Navigation

Apply the same navigation colors across Admin and Faculty portals.

### Light Mode

```text
Navbar background: #FFFFFF
Navbar text:       #17321F
Active item:       #159447
Active background: #E5F4EA
Border:            #B9DFC7
```

### Dark Mode

```text
Navbar background: #081A10
Navbar text:       #FFFFFF
Active item:       #159447
Active background: #12351F
Border:            #1B5737
```

Do not create different color systems for Admin and Faculty navigation.

---

# 5. Buttons

## Primary Button

Use for:

- Sign In
- Save & Continue
- Generate Recommendation
- Re-run Recommendation
- Trigger ML Retraining
- Other primary actions

```text
Background: #159447
Text:       #FFFFFF
Hover:      #08752F
```

Dark mode hover:

```text
Hover: #1FA95A
```

---

## Secondary Button

Use for less important actions.

```text
Background: transparent
Border:     #159447
Text:       #159447
```

Dark mode:

```text
Border: #159447
Text:   #FFFFFF
```

Do not use blue or gray buttons.

---

# 6. Tabs

### Active Tab

```text
Text:       #159447
Background: #E5F4EA
Border:     #B9DFC7
```

### Inactive Tab

Light:

```text
Text: #557061
Background: transparent
```

Dark:

```text
Text: #A9BCAF
Background: transparent
```

---

# 7. Cards

Cards must have a consistent appearance throughout the application.

### Light

```text
Background: #FFFFFF
Border:     #B9DFC7
```

### Dark

```text
Background: #0F281A
Border:     #1B5737
```

Do not randomly alternate between white, gray, green-gray, and other surface colors.

Use elevation primarily through subtle shadows and borders.

---

# 8. Status Badges

Standardize all badges.

### Success / Active / Ready

```text
Text:       #159447
Background: #E5F4EA
Border:     #B9DFC7
```

### Priority / Eligible / Important

Use gold:

```text
Text:       #D9A62E
Background: #F8EBC4
Border:     #D9A62E
```

### In Progress

Do NOT use blue.

Use green or gold depending on context.

```text
Text:       #159447
Background: #E5F4EA
Border:     #B9DFC7
```

### Role badges

Do not assign unrelated colors to different user roles.

Use:

```text
System Admin:     Green
Department Admin: Gold
Faculty:          Green
```

Role differences should primarily be communicated through text, icons, and labels—not unrelated colors.

---

# 9. Recommendation Charts

The competency prediction cards currently use green, gold, and blue/gray chart colors.

Remove the blue/gray colors.

Use:

```text
High confidence:   #159447
Second priority:   #D9A62E
Lower confidence:  #159447 with reduced opacity
```

For example:

```text
Machine Learning       → Green
Research Methods       → Gold
Educational Technology → Green
Data Analytics         → Green
Artificial Intelligence→ Green
```

Do not use blue for competency charts.

---

# 10. Questionnaire Parts

Standardize the Part 1–8 navigation.

### Active Part

Light:

```text
Background: #E5F4EA
Border:     #159447
Text:       #159447
```

Dark:

```text
Background: #12351F
Border:     #159447
Text:       #FFFFFF
```

### Completed/Inactive Parts

Dark mode should use dark green rather than gray.

```text
Background: #163B29
Border:     #1B5737
Text:       #FFFFFF
```

Do not use blue-gray cards.

---

# 11. Form Inputs

### Light

```text
Background: #FFFFFF
Border:     #B9DFC7
Text:       #17321F
Focus Border: #159447
```

### Dark

```text
Background: #081A10
Border:     #1B5737
Text:       #FFFFFF
Focus Border: #159447
```

Focus states should consistently use the primary green.

---

# 12. Progress Indicators

Use green as the main progress color.

```text
Progress: #159447
```

Use gold only for special milestones or important progress indicators.

Do not use blue or purple progress colors.

---

# 13. Icons

Use the same color hierarchy as the surrounding UI.

### Primary icons

```text
#159447
```

### Important/special icons

```text
#D9A62E
```

### Neutral icons

Use the theme's secondary text color.

Do not randomly assign blue, red, purple, or cyan to icons.

---

# 14. Error and Destructive Actions

The three-color brand system does **not** mean semantic colors must be eliminated completely.

A small amount of red is allowed **only for actual errors or destructive actions**.

```text
Error: #C83B25
```

Use it for:

- Delete confirmation
- Validation errors
- Failed operations
- Security warnings
- Destructive actions

Do not use red simply to differentiate a user role.

---

# 15. Remove These Inconsistencies

Search the entire project for hard-coded colors and replace inconsistent colors.

Pay particular attention to:

```text
Blue
Purple
Cyan
Random gray
Gray-blue
Random orange
Random red
Multiple unrelated yellow shades
```

Do not blindly replace semantic error colors.

---

# 16. Centralize the Color System

Do not define different colors separately inside every component.

Create/use centralized theme variables.

Example:

```css
:root {
  --color-primary: #159447;
  --color-primary-hover: #08752F;
  --color-primary-light: #E5F4EA;

  --color-accent: #D9A62E;
  --color-accent-light: #F8EBC4;

  --color-background: #FFFFFF;
  --color-surface: #FFFFFF;

  --color-border: #B9DFC7;

  --color-text: #17321F;
  --color-text-secondary: #557061;
  --color-text-muted: #718579;
}

.dark {
  --color-background: #081A10;
  --color-surface: #0F281A;
  --color-surface-elevated: #12351F;

  --color-primary: #159447;
  --color-primary-hover: #1FA95A;
  --color-primary-light: #1B5737;

  --color-accent: #D9A62E;
  --color-accent-light: #F2C94C;

  --color-border: #1B5737;

  --color-text: #FFFFFF;
  --color-text-secondary: #A9BCAF;
  --color-text-muted: #7F9989;
}
```

Adapt this to the project's existing Tailwind/CSS/theme architecture rather than creating a conflicting styling system.

---

# 17. Important Constraint

**Do not redesign the application.**

Do not change:

- Layout
- Component structure
- Navigation structure
- Typography
- Font family
- Spacing
- Button sizes
- Card sizes
- Icons
- Routes
- Functionality
- API behavior
- Database behavior
- Authentication
- Authorization
- ML functionality

Only modify the color implementation and theme consistency.

---

# 18. Final Visual Goal

The application should visually communicate:

```text
QSU Institutional Identity
        ↓
Green = Primary Brand
        ↓
Gold = Accent / Priority
        ↓
White = Light Theme Foundation
        ↓
Dark Green = Dark Theme Foundation
```

The final interface should feel like **one unified QSU Recommender application**, regardless of whether the user is viewing:

- Login
- Admin Dashboard
- Faculty Dashboard
- Questionnaire
- Recommendations
- Profile
- About System
- Admin management pages
- Training catalog
- Audit logs
- User management

Every page must follow the same color tokens and semantic rules.