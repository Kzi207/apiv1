import axios, { AxiosRequestConfig } from 'axios';
import { Request, Response, NextFunction } from 'express';

export const name = '/capcut/down';

export const index = async (req: Request, res: Response, next?: NextFunction) => {
	const { url } = req.query as { url?: string };
	if (!url) return res.json({ error: 'Thiếu dữ liệu để khởi chạy' });

	const options: AxiosRequestConfig = {
		url: String(url),
		method: 'GET',
		headers: {
			Connection: 'keep-alive',
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			// Accept-Encoding: gzip, deflate, br
			Cookie:
				'sessionid=f07988c4016328336b2076307a736d1a;sessionid_ss=f07988c4016328336b2076307a736d1a;sid_tt=f07988c4016328336b2076307a736d1a;sid_guard=f07988c4016328336b2076307a736d1a|1767610296|5184000|Fri, 06-Mar-2026 10:51:36 GMT;uid_tt=b50895576f8a1b63d5af43da312b5a2f2146709969ddfa18c10ed61c443346dd;uid_tt_ss=b50895576f8a1b63d5af43da312b5a2f2146709969ddfa18c10ed61c443346dd;ttwid=1|8WqmdMJ6wVwUN86_lRjCqWBbKz10xBVfOOWKdX-C0yA|1767610476|bc3b5612cde44eda6c33645576d3bc3be98c6c471dcd5d56792b34a0055d1cf5;msToken=bgYwTl6lUxwn63qyGdqD3Pi4Q7dSpeRe4tzMql2JHpVaETKl0SuR3IDVpO66SCaoGW-B63RlRuOip6P_uTyNoXlRxrviO3KRQt9n9WY3qSUtT54KjSuEiyklM6Sst135V7wd_yk3;odin_tt=731836f6fdcd9bcef1b0aa4af26ad034ab4b4f682b61991857516f22824c23db91011d289b5864cf562afbec4c4b3c47;passport_csrf_token=82c955c90184659efcb132502f734fa1;passport_csrf_token_default=82c955c90184659efcb132502f734fa1',
			Host: 'www.capcut.com',
			'User-Agent':
				'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
			'Accept-Language': 'vi-VN,vi;q=0.9',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'none',
			'Sec-Fetch-Dest': 'doc',
		},
		responseType: 'text',
		timeout: 10000,
	};

	try {
		const response = await axios.request(options);
		const getData = String(response.data || '');
		if (!getData.includes('"templateDetail":{')) {
			return res.status(404).json({ error: 'Không thể tìm thấy dữ liệu video này' });
		}

		const data = getData.split('"templateDetail":{')[1].split('"structuredData"')[0];
		const safeSplit = (s: string, key: string, end = '\",\"') => {
			try {
				return s.split(key)[1].split(end)[0];
			} catch (e) {
				return '';
			}
		};

		const title = safeSplit(data, '"title":"');
		const desc = safeSplit(data, '"desc":"');
		const getUrl = safeSplit(data, '"videoUrl":"', '\",\"');
		let videoUrl = '';
		try {
			videoUrl = decodeURIComponent(JSON.parse('"' + getUrl.replace(/\"/g, '\\\"') + '"'));
		} catch (e) {
			videoUrl = getUrl || '';
		}

		const playAmount = safeSplit(data, '"playAmount":', ',"');
		const usageAmount = safeSplit(data, '"usageAmount":', ',"');
		const likeAmount = safeSplit(data, '"likeAmount":', ',"');
		const commentAmount = safeSplit(data, '"commentAmount":', ',"');

		const dataObj = {
			tieude: title ? `${title}` : '',
			mota: desc ? `${desc}` : '',
			videUrl: videoUrl ? `${videoUrl}` : '',
			luotxem: playAmount ? `${playAmount}` : '',
			luotdung: usageAmount ? `${usageAmount}` : '',
			luotthich: likeAmount ? `${likeAmount}` : '',
			cmt: commentAmount ? `${commentAmount}` : '',
			author: 'nnl',
		};

		return res.json({ data: dataObj });
	} catch (error) {
		return res.status(500).json({ error: 'Không thể tìm thấy dữ liệu video này', details: String(error) });
	}
};

export default { name, index };

