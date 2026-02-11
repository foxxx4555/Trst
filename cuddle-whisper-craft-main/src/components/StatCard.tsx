import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'destructive';
}

const colorMap = {
  primary: 'from-primary/20 to-primary/5 border-primary/20',
  secondary: 'from-secondary/20 to-secondary/5 border-secondary/20',
  accent: 'from-accent/20 to-accent/5 border-accent/20',
  destructive: 'from-destructive/20 to-destructive/5 border-destructive/20',
};

const iconColorMap = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

export default function StatCard({ title, value, icon, color = 'primary' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-5 transition-shadow hover:shadow-lg",
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl", iconColorMap[color])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
