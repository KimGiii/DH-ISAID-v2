'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ArrowLeft from '@/public/images/arrow-left.svg';
import AddressSearch from '@/components/address-modal';
import { CustomInput } from '@/components/input';
import SecurePinModal from '@/components/secure-pin-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatPhoneNumber, formatTelNo, validateField } from '@/lib/utils';

// WebOTP API 타입 정의
// interface OTPCredential extends Credential {
//   code: string;
// }
//
// interface OTPCredentialRequestOptions extends CredentialRequestOptions {
//   otp: {
//     transport: string[];
//   };
// }

export interface FormData {
  name: string;
  nameEng: string;
  rrn: string;
  phone: string;
  verificationCode: string;
  address: string;
  telNo: string;
  email: string;
  password: string;
  passwordConfirm: string;
  pinCode: string;
  oldPassword?: string;
}

interface ValidationErrors {
  name: boolean;
  nameEng: boolean;
  phone: boolean;
  verificationCode: boolean;
  address: boolean;
  telNo: boolean;
  email: boolean;
  password: boolean;
  passwordConfirm: boolean;
  pinCode: boolean;
}

export default function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSecurePinModal, setShowSecurePinModal] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameEng: '',
    rrn: '',
    phone: '',
    verificationCode: '',
    address: '',
    telNo: '',
    email: '',
    password: '',
    passwordConfirm: '',
    pinCode: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    name: false,
    nameEng: false,
    phone: false,
    verificationCode: false,
    address: false,
    telNo: false,
    email: false,
    password: false,
    passwordConfirm: false,
    pinCode: false,
  });
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showPinError, setShowPinError] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setSending] = useState(false);

  const router = useRouter();

  const [sentCode, setSentCode] = useState<string | null>(null);

  // WebOTP API 지원 여부 확인
  const isWebOTPSupported =
    typeof window !== 'undefined' && 'OTPCredential' in window;

  // WebOTP 이벤트 리스너 설정
  // useEffect(() => {
  //   if (!isWebOTPSupported || currentStep !== 2) return; // phone step이 아닐 때는 리스너 제거
  //
  //   const abortController = new AbortController();
  //
  //   const handleWebOTP = async () => {
  //     try {
  //       const credential = (await navigator.credentials.get({
  //         otp: { transport: ['sms'] },
  //         signal: abortController.signal,
  //       } as OTPCredentialRequestOptions)) as OTPCredential;
  //
  //       if (credential && credential.code) {
  //         // WebOTP로 받은 코드를 인증번호 필드에 자동 입력
  //         handleInputChange('verificationCode', credential.code);
  //       }
  //     } catch (error) {
  //       // 사용자가 취소하거나 지원하지 않는 경우 무시
  //       console.log('WebOTP not available or cancelled:', error);
  //     }
  //   };
  //
  //   // 페이지가 포커스될 때 WebOTP 요청
  //   const handleFocus = () => {
  //     if (isCodeSent) {
  //       handleWebOTP();
  //     }
  //   };
  //
  //   window.addEventListener('focus', handleFocus);
  //
  //   return () => {
  //     abortController.abort();
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [isWebOTPSupported, currentStep, isCodeSent]);

  const steps: (keyof FormData)[] = [
    'name',
    'rrn',
    'phone',
    'address',
    'email',
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'rrn') {
      const raw = value.replace(/\D/g, '').slice(0, 13);
      setFormData((prev) => ({ ...prev, rrn: raw }));
      return;
    }

    if (field === 'phone') {
      const raw = value.replace(/\D/g, '').slice(0, 11);
      setFormData((prev) => ({ ...prev, [field]: raw }));

      setValidationErrors((prev) => ({
        ...prev,
        [field]: !validateField(field, raw, formData),
      }));
      return;
    }

    if (field === 'verificationCode') {
      const raw = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, verificationCode: raw }));

      setValidationErrors((prev) => ({
        ...prev,
        verificationCode: !validateField('verificationCode', raw, formData),
      }));
      return;
    }

    if (field === 'password') {
      const isValid = validateField(field, value, formData);
      setShowPasswordError(!isValid && value.length > 0);
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    setValidationErrors((prev) => ({
      ...prev,
      [field]: !validateField(field, value, formData),
    }));
  };

  const isCurrentStepValid = (): boolean => {
    const currentField = steps[currentStep];
    if (!currentField) return true;

    switch (currentField) {
      case 'name':
        return validateField('name', formData.name, formData);

      case 'rrn':
        return validateField('rrn', formData.rrn, formData);

      case 'phone':
        return (
          validateField('phone', formData.phone, formData) &&
          validateField(
            'verificationCode',
            formData.verificationCode,
            formData
          ) &&
          isCodeSent &&
          formData.verificationCode === sentCode
        );

      // 문자 인증 패스
      // case 'phone':
      //   return true;

      case 'address':
        return validateField('address', formData.address, formData);

      case 'email':
        return (
          validateField('email', formData.email, formData) &&
          validateField('password', formData.password, formData) &&
          validateField(
            'passwordConfirm',
            formData.passwordConfirm,
            formData
          ) &&
          validateField('pinCode', formData.pinCode, formData)
        );

      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          engName: formData.nameEng,
          email: formData.email,
          password: formData.password,
          rrn: formData.rrn,
          phone: formData.phone,
          address: formData.address,
          telno: formData.telNo,
          pinCode: formData.pinCode,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '알 수 없는 서버 오류');
      }

      router.push('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : '알 수 없는 오류가 발생했습니다.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSendCode = async () => {
    setSending(true);
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('올바른 휴대폰 번호를 입력해주세요.');
      setSending(false);
      return;
    }

    try {
      // 3자리 랜덤 인증번호 생성
      const code = Math.floor(100 + Math.random() * 900).toString();

      const response = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          code: code,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSentCode(code);
        setIsCodeSent(true);
        toast.success('인증번호가 전송되었습니다.');
        // WebOTP 지원 시 자동으로 인증번호 입력 요청
        // if (isWebOTPSupported) {
        //   setTimeout(() => {
        //     // 페이지 포커스 시 WebOTP 요청
        //     window.focus();
        //   }, 1000);
        // }
      } else {
        alert('인증번호 전송에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('SMS 전송 오류:', error);
      alert('인증번호 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  const handleAddressSelect = (address: string) => {
    handleInputChange('address', address);
    setShowAddressModal(false);
  };

  const formatRRN = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);

    if (digits.length <= 6) {
      return digits;
    }

    if (digits.length === 7) {
      return `${digits.slice(0, 6)}-${digits[6]}`;
    }

    const head = digits.slice(0, 6);
    const first = digits[6];
    const extra = digits.length - 7;
    return `${head}-${first}${'•'.repeat(extra)}`;
  };

  return (
    <div className='bg-white'>
      <div
        className='
        fixed top-0 left-0 right-0
        w-full max-w-[768px] mx-auto
        py-3 px-6'
        onClick={handleBack}
      >
        <ArrowLeft />
      </div>
      <div className='flex gap-2 px-4 mb-12'>
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium  ${
              index < currentStep
                ? 'bg-primary text-white'
                : index === currentStep
                  ? 'bg-primary text-white'
                  : 'bg-white border border-primary text-primary'
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>

      <div className='px-4 flex-1'>
        <div className='overflow-hidden'>
          <div
            className='flex transition-transform duration-300 ease-in-out'
            style={{ transform: `translateX(-${currentStep * 100}%)` }}
          >
            <div className='w-full flex-shrink-0 flex flex-col gap-3'>
              <h1 className='text-xl mb-8 font-light'>이름을 입력해주세요</h1>
              <div className='flex flex-col gap-1'>
                <span className='text-gray-500 text-sm'>
                  이름을 입력해주세요.
                </span>
                <CustomInput
                  type='text'
                  thin={true}
                  placeholder='이름을 입력해주세요'
                  name='name'
                  field='name'
                  value={formData.name}
                  onChangeField={handleInputChange}
                />
              </div>
              <div className='flex flex-col gap-1'>
                <p className='text-gray-500 text-sm '>
                  영문 이름을 입력해주세요. (선택)
                </p>
                <CustomInput
                  type='text'
                  thin={true}
                  placeholder='이름을 입력해주세요'
                  name='nameEng'
                  field='nameEng'
                  value={formData.nameEng}
                  onChangeField={handleInputChange}
                />
              </div>
            </div>

            <div className='w-full flex-shrink-0'>
              <h1 className='text-xl font-light mb-8'>
                주민등록번호를 입력해주세요
              </h1>
              <p className='text-gray-500 text-sm mb-2'>
                금융 서비스 이용을 위해 필요해요.
              </p>
              <div className=''>
                <CustomInput
                  type='text'
                  thin={true}
                  placeholder='123456-1234567'
                  name='rrn'
                  field='rrn'
                  value={formData.rrn}
                  displayValue={formatRRN(formData.rrn)}
                  onChangeField={handleInputChange}
                />
              </div>
            </div>

            <div className='w-full flex-shrink-0'>
              <h1 className='text-xl mb-8 font-light'>
                인증번호를 입력해주세요.
              </h1>
              <p className='text-gray-500 text-sm mb-2'>
                본인 확인을 위해 필요해요.
              </p>
              <div className='mb-2'>
                <div className='flex gap-2'>
                  <div className='flex-1'>
                    <CustomInput
                      type='number'
                      thin={true}
                      placeholder='010-1234-5678'
                      name='phone'
                      field='phone'
                      value={formData.phone}
                      displayValue={formatPhoneNumber(formData.phone)}
                      onChangeField={handleInputChange}
                    />
                  </div>
                  <button
                    onClick={handleSendCode}
                    className='bg-primary text-white px-4 py-2 rounded-xl disabled:bg-subtitle disabled:cursor-not-allowed'
                    disabled={isSending}
                  >
                    인증번호 전송
                  </button>
                </div>
              </div>
              <div className=''>
                <p className='text-gray-500 text-sm mb-2'>인증 번호</p>
                <CustomInput
                  type='number'
                  thin={true}
                  placeholder='인증번호 3자리 입력'
                  name='verificationCode'
                  field='verificationCode'
                  value={formData.verificationCode}
                  onChangeField={handleInputChange}
                  autocomplete='one-time-code'
                />
                {isCodeSent &&
                  formData.verificationCode.length === 3 &&
                  formData.verificationCode !== sentCode && (
                    <p className='text-xs text-red-500 mt-1'>
                      인증번호가 일치하지 않습니다.
                    </p>
                  )}
                {isCodeSent && formData.verificationCode.length < 3 && (
                  <p className='text-xs text-primary mt-1'>
                    SMS로 받은 인증번호를 입력해주세요.
                  </p>
                )}
              </div>
            </div>

            <div className='w-full flex-shrink-0'>
              <h1 className='text-xl  mb-8 font-light'>주소를 입력해주세요.</h1>
              <p className='text-gray-500 text-sm mb-2'>
                본인 확인을 위해 필요해요.
              </p>
              <div className='space-y-2'>
                <div onClick={() => setShowAddressModal(true)}>
                  <CustomInput
                    type='text'
                    thin={true}
                    placeholder='서울시 강남구 대치동 123'
                    name='address'
                    field='address'
                    value={formData.address}
                    onChangeField={handleInputChange}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <span className='text-gray-500 text-sm'>
                  자택 번호를 입력해주세요. (선택)
                </span>
                <CustomInput
                  type='number'
                  thin={true}
                  placeholder='02-913-9112'
                  name='telNo'
                  field='telNo'
                  value={formData.telNo}
                  displayValue={formatTelNo(formData.telNo)}
                  onChangeField={handleInputChange}
                />
              </div>
            </div>

            <div className='w-full flex-shrink-0'>
              <h1 className='text-xl mb-2 font-light'>
                본인 인증을 완료해주세요.
              </h1>
              <p className='text-gray-500 text-sm mb-2'>
                마지막 단계에요! 거의 다 왔어요.
              </p>
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='email' className='text-gray-600'>
                    이메일
                  </Label>
                  <CustomInput
                    type='email'
                    thin={true}
                    placeholder='test@example.com'
                    name='email'
                    field='email'
                    value={formData.email}
                    onChangeField={handleInputChange}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='password' className='text-gray-600'>
                    비밀번호
                  </Label>
                  <CustomInput
                    type='password'
                    thin={true}
                    placeholder='비밀번호'
                    name='password'
                    field='password'
                    value={formData.password}
                    onChangeField={handleInputChange}
                  />

                  <p
                    className={`text-xs text-gray-500 ${
                      formData.password
                        ? showPasswordError
                          ? 'text-red-500'
                          : 'text-primary'
                        : 'text-gray-500'
                    }`}
                  >
                    영문+숫자+특수 문자, 8자 이상으로 조합해서 만들어 주세요
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='password' className='text-gray-600'>
                    비밀번호 확인
                  </Label>
                  <CustomInput
                    type='password'
                    thin={true}
                    placeholder='비밀번호'
                    name='passwordConfirm'
                    field='passwordConfirm'
                    value={formData.passwordConfirm}
                    onChangeField={handleInputChange}
                  />

                  <p
                    className={`text-xs text-gray-500 ${
                      formData.passwordConfirm
                        ? formData.password != formData.passwordConfirm
                          ? 'text-red-500'
                          : 'text-primary'
                        : 'text-gray-500'
                    }`}
                  >
                    비밀번호를 한번 더 입력해주세요.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='password' className='text-gray-600'>
                    간편 비밀번호
                  </Label>
                  <div onClick={() => setShowSecurePinModal(true)}>
                    <CustomInput
                      type='password'
                      thin={true}
                      placeholder='간편 비밀번호'
                      name='pinCode'
                      field='pinCode'
                      value={'●'.repeat(formData.pinCode.length)}
                      onChangeField={() => {}}
                    />
                  </div>

                  <p
                    className={`text-xs text-gray-500 ${
                      formData.pinCode
                        ? showPinError
                          ? 'text-red-500'
                          : 'text-primary'
                        : 'text-gray-500'
                    }`}
                  >
                    숫자 6자리를 조합해서 만들어 주세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleNext}
        disabled={!isCurrentStepValid() || isSubmitting}
        className={`w-full py-4 font-medium max-w-[768px]
          fixed bottom-0 mx-auto inset-x-0 pt-5 pb-10  hover:bg-primary 
          ${isCurrentStepValid() ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        {currentStep === steps.length - 1 ? '시작하기' : '다음으로'}
      </Button>
      {submitError && (
        <p className='mt-2 text-center text-sm text-red-500'>{submitError}</p>
      )}

      {showAddressModal && (
        <AddressSearch
          onCompleteAction={(addr) => handleAddressSelect(addr)}
          onCloseAction={() => setShowAddressModal(false)}
          openState={showAddressModal}
        />
      )}
      {showSecurePinModal && (
        <SecurePinModal
          visible={showSecurePinModal}
          onClose={() => setShowSecurePinModal(false)}
          onSubmit={async (pin) => {
            setFormData((prev) => ({ ...prev, pinCode: pin }));
            setShowSecurePinModal(false);
            const isValid = validateField('pinCode', pin, formData);
            setShowPinError(!isValid);
            return true;
          }}
        />
      )}
    </div>
  );
}
