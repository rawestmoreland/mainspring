import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

export function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onValueChange={(lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('i18n-lang', lng);
      }}
    >
      <SelectTrigger size='sm' className='w-auto gap-1.5 font-mono text-xs'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position='popper' align='end'>
        {LANGUAGES.map(({ code, label, flag }) => (
          <SelectItem key={code} value={code} className='font-mono text-xs'>
            <span>{flag}</span>
            <span>{label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
