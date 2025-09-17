# Project Rules for TB Outbreak Prediction (West Africa)

## 1. Code Style and Documentation
- Use industry-standard Python style (PEP8).
- All function names must be descriptive and use snake_case.
- Every function must include a docstring explaining:
  - Why the function is used
  - What it does
  - Any edge cases handled
- Inline comments should clarify non-obvious logic or design choices.

## 2. Data Privacy
- Only use datasets that do not contain real personal identifiers.
- Ensure all data is anonymized and aggregated at the country or region level.

## 3. Notebook Structure and Clarity
- Notebooks must be logically organized: introduction, data loading, preprocessing, modeling, evaluation, and conclusions.
- Use markdown cells to explain each step and its purpose.
- Code and outputs should be easy to follow for new users.

## 4. Function Performance
- Functions should be optimized for speed and memory efficiency.
- Avoid unnecessary loops; use vectorized operations where possible.
- Profile and refactor slow code if needed.

## 5. Copilot Collaboration
- Copilot should always follow these rules when generating or editing code.
- Major changes or refactoring should be explained in comments or markdown.
- All code and notebooks should be reproducible and well-documented.
