# Guideline for Pattern Syntax

The following describes:

- the mandatory pattern syntax  
- rules for variable and sequence names  
- formatting options  

## Basic Structure of the Syntax

A pattern consists of a sequence of tokens. Tokens can be:

- constants (fixed text or characters)  
- variables (`{VAR ...}`)  
- sequences (`{SEQ ...}`)  
- date values (`{DATE ...}`)

All dynamic components are enclosed in curly braces. Constants are not.

## Token Types

### Sequences (running numbers)

`{SEQ name:padding}`

Generates a numeric, ascending sequence with left-side zero-padding.

Example:

~~~ 
{SEQ inventar:6} → 000123
~~~ 

~~~ 
{SEQ teil:3}
~~~ 

~~~ 
{SEQ ohnepadding:1}
~~~ 

### Variables

`{VAR name}`

The value is defined in the variable configuration via a JSON path taken from the object’s own JSON data. The object type must be prefixed.

Examples:
~~~ 
objekt.anzahl_teile
objekt.lk_dante_einzelobjekt.conceptName
objekt.alte_id
complex._nested:complex__multi[1]._nested:complex__multi__more_multi[1].text
~~~

### Date Placeholders

`{DATE FORMAT}`

The `FORMAT` string follows ISO 8601.

ISO-8601-compliant placeholders:

| Placeholder | Meaning | Example |
|------------|----------|---------|
| YYYY | four-digit year | 2026 |
| YY | two-digit year | 26 |
| MM | two-digit month (01–12) | 07 |
| M | one-digit month (1–12) | 4 |
| DD | two-digit day (01–31) | 24 |
| D | one-digit day (1–31) | 3 |

Examples:
~~~ 
{DATE YYYY-MM-DD}
{DATE YYYYMMDD}
{DATE YYYY-M-D}
{DATE YYYY-MM}
{DATE YYYY}
{DATE D}
{DATE D/M/YY}
{DATE M/YYYY}
{DATE D.M.YY}
~~~ 

## Naming Rules for Variables and Sequences

All variable and sequence names must:

- use only lowercase letters  
- avoid umlauts and ß (use ae, oe, ue instead)  
- use only the following characters: a–z, 0–9, _  
- not begin with a number  
- not contain hyphens, special characters, or spaces  
- be unique within a single pattern  
- recommended for longer terms: snake_case  

Regular expression:
~~~ 
^[a-z][a-z0-9_]*$
~~~ 

## Formatting Rules

### Constant Characters

Constant text is written directly:

Beispiele:
~~~ 
mus/{DATE YYYY}/
archiv-
obj_
123-abc
~~~ 

## Example Patterns

~~~ 
{SEQ inventar:6}
{SEQ haupt:5}/{SEQ teil:6}
arch-{VAR reihe}/{SEQ laufnummer:4}
mus/{VAR standortcode}/{DATE YYYY-MM-DD}/{SEQ objekt:5}
~~~ 