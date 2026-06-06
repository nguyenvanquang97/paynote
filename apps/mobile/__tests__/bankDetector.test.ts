import {detectBank} from '../src/modules/banking/detectors';

describe('detectBank', () => {
  it('detects MB Bank from package name', () => {
    expect(detectBank('com.mbmobile')).toBe('mbbank');
  });

  it('falls back to app title when package name is not recognized', () => {
    expect(detectBank('com.android.shell', 'MB Bank')).toBe('mbbank');
  });
});
