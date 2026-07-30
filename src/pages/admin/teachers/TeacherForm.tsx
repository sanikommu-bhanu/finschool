import { useEffect, useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { HiOutlineUser, HiOutlinePhone, HiOutlineMail, HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineChartPie } from 'react-icons/hi';
import { teacherSchema, defaultTeacherValues, type TeacherFormValues } from '@/schemas/teacher.schema';

interface Props {
  defaultValues?: TeacherFormValues;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: TeacherFormValues) => void;
}

const FloatingInput = forwardRef(({ label, icon: Icon, type = 'text', error, ...props }: any, ref: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || !!props.value;
  
  return (
    <div className="relative mb-1 group">
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${active ? 'text-blush-600 dark:text-blush-400' : 'text-blush-700/40 dark:text-blush-200/30'}`}>
        <Icon size={18} />
      </div>
      <input
        ref={ref}
        type={type}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={clsx(
          "w-full px-4 py-3.5 pl-11 bg-white/40 dark:bg-black/20 backdrop-blur-md border outline-none transition-all duration-300 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-transparent",
          focused 
            ? "border-blush-400/60 dark:border-blush-500/60 shadow-[0_0_15px_rgba(255,182,193,0.3)]" 
            : error 
              ? "border-rose-400/60 shadow-[0_0_15px_rgba(251,113,133,0.15)]" 
              : "border-white/40 dark:border-white/10 hover:border-blush-300/50"
        )}
        {...props}
      />
      <label className={`absolute left-11 transition-all duration-300 pointer-events-none
        ${active ? '-top-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2 text-[10px] font-bold text-blush-600 dark:text-blush-400 rounded-full' : 'top-3.5 text-sm text-blush-700/50 dark:text-blush-200/40'}`}>
        {label}
      </label>
      {error && <p className="text-[10px] text-rose-500 font-semibold absolute -bottom-4 right-1">{error.message}</p>}
    </div>
  );
});

const FloatingSelect = forwardRef(({ label, icon: Icon, error, children, ...props }: any, ref: any) => {
  const [focused, setFocused] = useState(false);
  const active = focused || !!props.value;
  
  return (
    <div className="relative mb-1 group">
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${active ? 'text-blush-600 dark:text-blush-400' : 'text-blush-700/40 dark:text-blush-200/30'}`}>
        <Icon size={18} />
      </div>
      <select
        ref={ref}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={clsx(
          "appearance-none w-full px-4 py-3.5 pl-11 bg-white/40 dark:bg-black/20 backdrop-blur-md border outline-none transition-all duration-300 rounded-2xl text-sm text-gray-900 dark:text-white",
          focused 
            ? "border-blush-400/60 dark:border-blush-500/60 shadow-[0_0_15px_rgba(255,182,193,0.3)]" 
            : error 
              ? "border-rose-400/60" 
              : "border-white/40 dark:border-white/10 hover:border-blush-300/50"
        )}
        {...props}
      >
        {children}
      </select>
      <label className={`absolute left-11 -top-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-2 text-[10px] font-bold text-blush-600 dark:text-blush-400 rounded-full transition-all duration-300 pointer-events-none`}>
        {label}
      </label>
      {error && <p className="text-[10px] text-rose-500 font-semibold absolute -bottom-4 right-1">{error.message}</p>}
    </div>
  );
});

export function TeacherForm({ defaultValues, submitting, submitLabel, onSubmit }: Props) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: defaultValues ?? defaultTeacherValues,
  });

  useEffect(() => { reset(defaultValues ?? defaultTeacherValues); }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2 pb-6">
      
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-blush-700/60 dark:text-blush-200/50 ml-2">Personal Details</h4>
        
        <FloatingInput 
          label="Full Name" 
          icon={HiOutlineUser} 
          placeholder="Neha Kapoor"
          error={errors.name}
          value={watch('name')}
          {...register('name')} 
        />
        
        <FloatingInput 
          label="Email Address" 
          icon={HiOutlineMail} 
          placeholder="neha.kapoor@school.edu"
          error={errors.email}
          value={watch('email')}
          {...register('email')} 
        />

        <FloatingInput 
          label="Phone Number" 
          icon={HiOutlinePhone} 
          placeholder="+91 98765 43210"
          error={errors.phone}
          value={watch('phone')}
          {...register('phone')} 
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-blush-700/60 dark:text-blush-200/50 ml-2">Academic Profile</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput 
            label="Subject" 
            icon={HiOutlineAcademicCap} 
            placeholder="Mathematics"
            error={errors.subject}
            value={watch('subject')}
            {...register('subject')} 
          />
          
          <FloatingInput 
            label="Classes" 
            icon={HiOutlineBriefcase} 
            placeholder="10A, 10B"
            error={errors.classes}
            value={watch('classes')}
            {...register('classes')} 
          />
        </div>

        <FloatingSelect 
          label="Status" 
          icon={HiOutlineChartPie} 
          error={errors.status}
          value={watch('status')}
          {...register('status')}
        >
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
        </FloatingSelect>
      </div>

      <Button type="submit" fullWidth size="lg" disabled={submitting} className={`font-bold text-[15px] shadow-xl shadow-blush-500/20 mt-4 transition-all ${submitting ? 'opacity-80 cursor-wait scale-[0.98]' : 'hover:scale-[1.02]'}`}>
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </span>
        ) : submitLabel}
      </Button>
    </form>
  );
}
