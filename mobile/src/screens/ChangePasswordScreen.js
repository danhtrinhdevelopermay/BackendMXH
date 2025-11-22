import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { otpAPI } from '../api/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChangePasswordScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [testModeCode, setTestModeCode] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);

  const otpInputs = useRef([]);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const response = await otpAPI.sendOTP();
      setEmail(response.data.email);
      setStep(2);
      setTimeLeft(300);
      setCanResend(false);
      
      // Handle test mode
      if (response.data.testMode && response.data.otpCode) {
        setIsTestMode(true);
        setTestModeCode(response.data.otpCode);
        showAlert('Chế độ Test', `Mã OTP: ${response.data.otpCode}`, 'info');
      } else {
        setIsTestMode(false);
        showAlert('Thành công', 'Mã OTP đã được gửi đến email của bạn', 'success');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showAlert('Lỗi', error.response?.data?.error || 'Không thể gửi mã OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    otpInputs.current[0]?.focus();
    await handleSendOTP();
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedCode[i] || '';
      }
      setOtp(newOtp);
      if (pastedCode.length === 6) {
        otpInputs.current[5]?.blur();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ mã OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      await otpAPI.verifyOTP(otpCode);
      setStep(3);
      showAlert('Thành công', 'Xác minh OTP thành công', 'success');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showAlert('Lỗi', error.response?.data?.error || 'Mã OTP không đúng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Lỗi', 'Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setLoading(true);
    try {
      const otpCode = otp.join('');
      await otpAPI.changePasswordWithOTP(otpCode, newPassword);
      showAlert('Thành công', 'Đổi mật khẩu thành công', 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Error changing password:', error);
      showAlert('Lỗi', error.response?.data?.error || 'Không thể đổi mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.iconGradient}
        >
          <Ionicons name="shield-checkmark" size={48} color="#fff" />
        </LinearGradient>
      </View>
      
      <Text style={styles.title}>Xác minh tài khoản</Text>
      <Text style={styles.subtitle}>
        Để bảo mật tài khoản, chúng tôi sẽ gửi mã xác minh OTP đến email của bạn
      </Text>

      <View style={styles.infoBox}>
        <Ionicons name="mail" size={20} color="#667eea" />
        <Text style={styles.infoText}>
          Email đã đăng ký: <Text style={styles.boldText}>{user?.email || 'Chưa có email'}</Text>
        </Text>
      </View>

      {!user?.email && (
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            Tài khoản chưa có email. Vui lòng cập nhật email trong trang Hồ sơ trước.
          </Text>
        </View>
      )}

      <TouchableOpacity 
        onPress={handleSendOTP} 
        disabled={loading || !user?.email}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.button, (!user?.email || loading) && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.buttonText}>Gửi mã OTP</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.iconGradient}
        >
          <Ionicons name="mail-open" size={48} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Nhập mã OTP</Text>
      <Text style={styles.subtitle}>
        Chúng tôi đã gửi mã xác minh 6 số đến {email}
      </Text>

      {isTestMode && testModeCode && (
        <View style={styles.testModeBox}>
          <View style={styles.testModeHeader}>
            <Ionicons name="flask" size={18} color="#f59e0b" />
            <Text style={styles.testModeTitle}>Chế độ Test</Text>
          </View>
          <Text style={styles.testModeSubtitle}>
            Dịch vụ email đang ở chế độ test. Sử dụng mã dưới đây:
          </Text>
          <View style={styles.testCodeBox}>
            <Text style={styles.testCode}>{testModeCode}</Text>
            <TouchableOpacity 
              onPress={() => {
                const digits = testModeCode.split('');
                setOtp(digits);
              }}
              style={styles.copyButton}
            >
              <Ionicons name="copy" size={18} color="#667eea" />
              <Text style={styles.copyButtonText}>Dán vào</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <RNTextInput
            key={index}
            ref={ref => otpInputs.current[index] = ref}
            style={styles.otpInput}
            value={digit}
            onChangeText={(value) => handleOtpChange(index, value)}
            onKeyPress={({ nativeEvent: { key } }) => handleOtpKeyPress(index, key)}
            keyboardType="number-pad"
            maxLength={index === 0 ? 6 : 1}
            selectTextOnFocus
          />
        ))}
      </View>

      <View style={styles.timerContainer}>
        <Ionicons name="time" size={16} color={timeLeft > 0 ? '#667eea' : '#ef4444'} />
        <Text style={[styles.timerText, timeLeft === 0 && styles.timerExpired]}>
          {timeLeft > 0 ? `Mã hết hạn sau ${formatTime(timeLeft)}` : 'Mã đã hết hạn'}
        </Text>
      </View>

      {canResend && (
        <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
          <Ionicons name="refresh" size={16} color="#667eea" />
          <Text style={styles.resendText}>Gửi lại mã OTP</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        onPress={handleVerifyOTP} 
        disabled={loading || otp.join('').length !== 6}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.button, (loading || otp.join('').length !== 6) && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Xác minh</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.iconGradient}
        >
          <Ionicons name="lock-closed" size={48} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Đặt mật khẩu mới</Text>
      <Text style={styles.subtitle}>
        Vui lòng nhập mật khẩu mới cho tài khoản của bạn
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          label="Mật khẩu mới"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon 
              icon={showPassword ? "eye-off" : "eye"} 
              onPress={() => setShowPassword(!showPassword)}
            />
          }
          style={styles.input}
          outlineColor="#e5e7eb"
          activeOutlineColor="#667eea"
        />

        <TextInput
          label="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" />}
          style={styles.input}
          outlineColor="#e5e7eb"
          activeOutlineColor="#667eea"
        />
      </View>

      <View style={styles.passwordTip}>
        <Ionicons name="information-circle" size={16} color="#6b7280" />
        <Text style={styles.tipText}>Mật khẩu phải có ít nhất 6 ký tự</Text>
      </View>

      <TouchableOpacity 
        onPress={handleChangePassword} 
        disabled={loading || !newPassword || !confirmPassword}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={[styles.button, (loading || !newPassword || !confirmPassword) && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.buttonText}>Đổi mật khẩu</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((num) => (
            <View key={num} style={styles.stepDot}>
              <View style={[
                styles.dot, 
                num === step ? styles.dotActive : num < step ? styles.dotCompleted : null
              ]}>
                {num < step && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              {num < 3 && <View style={[styles.stepLine, num < step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  stepDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: '#667eea',
  },
  dotCompleted: {
    backgroundColor: '#10b981',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#10b981',
  },
  stepContainer: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4c1d95',
  },
  boldText: {
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },
  buttonWrapper: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timerText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  timerExpired: {
    color: '#ef4444',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginBottom: 10,
  },
  resendText: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '600',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
  },
  passwordTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  testModeBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  testModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  testModeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  testModeSubtitle: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 12,
  },
  testCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcd34d',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  testCode: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#78350f',
    letterSpacing: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
});

export default ChangePasswordScreen;
