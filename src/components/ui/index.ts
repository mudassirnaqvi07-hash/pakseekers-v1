/**
 * UI Components — barrel export.
 *
 * Import from "@/components/ui" rather than individual file paths:
 *   import { Button, Card, Input, Badge, Select, Textarea } from "@/components/ui";
 */

export { Button } from "./button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./button";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Select } from "./select";
export type { SelectProps, SelectOption } from "./select";

export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";

export { Card, CardHeader, CardFooter, CardContent } from "./card";
export type { CardProps, CardHeaderProps, CardFooterProps } from "./card";

export { Badge } from "./badge";
export type { BadgeProps, BadgeVariant } from "./badge";
