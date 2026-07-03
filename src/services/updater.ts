import {Linking} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {dialog} from '../shared/components/Dialog';
import {toast} from '../shared/components/Toast';

const GITHUB_REPO = 'nguyenvanquang97/paynote';

export const checkForUpdates = async (silent = true) => {
  try {
    const currentVersion = DeviceInfo.getVersion();
    
    // Fetch latest release from GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!response.ok) {
      if (!silent) {
        toast.warning('Không thể kiểm tra bản cập nhật lúc này.');
      }
      return;
    }

    const data = await response.json();
    const latestVersion = data.tag_name ? data.tag_name.replace('v', '') : '';
    const apkAsset = data.assets?.find((asset: any) => asset.name.endsWith('.apk'));

    if (latestVersion && latestVersion !== currentVersion) {
      const isNewer = compareVersions(latestVersion, currentVersion) > 0;
      
      if (isNewer && apkAsset) {
        dialog.confirm(
          'Bản cập nhật mới',
          `Phiên bản mới ${data.tag_name} đã sẵn sàng.\n\nCó gì mới:\n${data.name}`,
          {
            confirmText: 'Cập nhật ngay',
            cancelText: 'Để sau',
            variant: 'default',
            onConfirm: () => {
              Linking.openURL(apkAsset.browser_download_url);
            },
          }
        );
      } else if (!silent) {
        toast.success('Bạn đang sử dụng phiên bản mới nhất.');
      }
    } else if (!silent) {
      toast.success('Bạn đang sử dụng phiên bản mới nhất.');
    }
  } catch (error) {
    console.error('Update check failed:', error);
    if (!silent) {
      toast.error('Có lỗi xảy ra khi kiểm tra cập nhật.');
    }
  }
};

// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if v1 == v2
const compareVersions = (v1: string, v2: string) => {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;
    if (p1 > p2) {return 1;}
    if (p1 < p2) {return -1;}
  }
  return 0;
};
