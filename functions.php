<?php

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'register_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'login_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/update-order-status', array(
        'methods' => ['POST', 'OPTIONS'],
        'callback' => 'update_order_status_callback',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/my-orders', array(
        'methods' => 'GET',
        'callback' => 'get_user_orders_api',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ));
});

function register_user_api($request) {
    $username = sanitize_user($request['username']);
    $email = sanitize_email($request['email']);
    $password = $request['password'];

    $error = new WP_Error();

    if (empty($username)) {
        $error->add('username_empty', '사용자 이름은 필수입니다.');
    }
    if (empty($email)) {
        $error->add('email_empty', '이메일은 필수입니다.');
    }
    if (empty($password)) {
        $error->add('password_empty', '비밀번호는 필수입니다.');
    }

    if ($error->get_error_codes()) {
        return $error;
    }

    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    $user = new WP_User($user_id);
    $user->set_role('customer');

    return array(
        'status' => 'success',
        'message' => '회원가입이 완료되었습니다.'
    );
}

function login_user_api($request) {
    $username = $request['username'];
    $password = $request['password'];

    $user = wp_authenticate($username, $password);

    if (is_wp_error($user)) {
        return new WP_Error(
            'login_failed',
            '아이디 또는 비밀번가 올바지 않습니다.',
            array('status' => 401)
        );
    }

    return array(
        'status' => 'success',
        'message' => '로그인 성공',
        'user' => array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'displayName' => $user->display_name
        )
    );
}

function update_order_status_callback($request) {
    $json = $request->get_json_params();
    $order_id = isset($json['order_id']) ? sanitize_text_field($json['order_id']) : '';
    
    error_log('[토스페이먼츠] 주문 상태 업데이트 시작 - Order ID: ' . $order_id);
    
    if (empty($order_id)) {
        return new WP_Error('no_order_id', '주문 ID가 필요합니다.', array('status' => 400));
    }

    try {
        // 주문 ID 정리
        $order_id = str_replace('#', '', $order_id);
        
        // WooCommerce 주문 객체 가져오기
        $order = wc_get_order($order_id);
        if (!$order) {
            throw new Exception('주문을 찾을 수 없습니다.');
        }

        // 결제 완료 처리
        $order->payment_complete();
        
        // 주문 상태 변경
        $order->update_status('processing');
        
        // 주문 메모 추가
        $order->add_order_note('토스페이먼츠 결제가 완료되었습니다.');
        
        // 변경사항 저장
        $order->save();
        
        error_log('[토스페이먼츠] 주문 처리 완료 - Order ID: ' . $order_id);
        
        return array(
            'success' => true,
            'message' => '주문 상태가 업데이트되었습니다.',
            'order_id' => $order_id
        );
        
    } catch (Exception $e) {
        error_log('[토스페이먼츠] 오류 발생: ' . $e->getMessage());
        return new WP_Error(
            'update_failed',
            '주문 상태 업데이트 실패: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}

function get_user_orders_api($request) {
    $user_id = get_current_user_id();
    
    // 추가 보안 검증
    if (!$user_id || !current_user_can('read')) {
        return new WP_Error(
            'unauthorized',
            '접근 권한이 없습니다.',
            array('status' => 401)
        );
    }

    try {
        $args = array(
            'customer_id' => $user_id,
            'limit' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        );

        $orders = wc_get_orders($args);
        
        // 결과 검증
        if (is_wp_error($orders)) {
            throw new Exception($orders->get_error_message());
        }

        $formatted_orders = array();
        foreach ($orders as $order) {
            // 주문 소유자 재검증
            if ($order->get_customer_id() !== $user_id) {
                continue;
            }
            
            $formatted_orders[] = array(
                'id' => $order->get_id(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
                'payment_method' => $order->get_payment_method_title(),
                'items' => array_map(function($item) {
                    return array(
                        'name' => $item->get_name(),
                        'quantity' => $item->get_quantity(),
                        'total' => $item->get_total()
                    );
                }, $order->get_items())
            );
        }

        // 로깅 추가
        error_log(sprintf(
            '[주문조회] 사용자 ID: %d, 조회된 주문 수: %d',
            $user_id,
            count($formatted_orders)
        ));

        return array(
            'success' => true,
            'orders' => $formatted_orders
        );

    } catch (Exception $e) {
        error_log('[주문조회 오류] ' . $e->getMessage());
        return new WP_Error(
            'order_fetch_error',
            '주문 정보를 가져오는데 실패했습니다: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}

// CORS 설정 통합
add_action('init', function() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
        header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 3600");
    }
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
});

add_filter('woocommerce_rest_check_permissions', function($permission, $context, $object_id, $post_type) {
    if ($post_type === 'shop_order') {
        error_log('WooCommerce 주문 권한 체크: ' . $context);
        
        if (!is_user_logged_in()) {
            return false;
        }
        
        if ($object_id) {
            $order = wc_get_order($object_id);
            if ($order) {
                return $order->get_customer_id() === get_current_user_id();
            }
        }
    }
    return $permission;
}, 10, 4);

add_filter('woocommerce_rest_pre_insert_shop_order_object', function($order, $request) {
    error_log('WooCommerce 주문 생성 요청 데이터: ' . print_r($request->get_params(), true));
    return $order;
}, 10, 2);

add_filter('rest_pre_dispatch', function($result, $server, $request) {
    if (strpos($request->get_route(), '/wc/v3/orders') !== false) {
        error_log('WooCommerce API 요청 경로: ' . $request->get_route());
        error_log('WooCommerce API 요청 메소드: ' . $request->get_method());
        error_log('WooCommerce API 요청 헤더: ' . print_r($request->get_headers(), true));
        error_log('WooCommerce API 요청 파라미터: ' . print_r($request->get_params(), true));
    }
    return $result;
}, 10, 3);

add_filter('woocommerce_rest_pre_dispatch', function($result, $server, $request) {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true");
    }
    return $result;
}, 10, 3);

add_action('woocommerce_order_status_changed', function($order_id, $old_status, $new_status) {
    error_log(sprintf(
        '주문 상태 변경 - Order ID: %s, Old Status: %s, New Status: %s',
        $order_id,
        $old_status,
        $new_status
    ));
}, 10, 3);

// 비로그인 사용자 카트 기능 활성화
add_filter('woocommerce_persistent_cart_enabled', '__return_true');

// 세션 시작
add_action('init', function() {
    if (!session_id()) {
        session_start();
    }
});

// 비로그인 사용자 카트 키 설정
add_filter('woocommerce_cart_session_key', function($key, $customer_id) {
    if ($customer_id === 0) {
        if (!isset($_SESSION['guest_cart_key'])) {
            $_SESSION['guest_cart_key'] = wp_generate_uuid4();
        }
        return 'guest_cart_' . $_SESSION['guest_cart_key'];
    }
    return $key;
}, 10, 2);

// 카트 저장 간격 설정
add_filter('woocommerce_cart_session_save_interval', function() {
    return 60 * 60; // 1시간
});

// 게스트 카트 데이터 저장
add_action('woocommerce_cart_updated', function() {
    if (!is_user_logged_in() && isset($_SESSION['guest_cart_key'])) {
        $cart_key = 'guest_cart_' . $_SESSION['guest_cart_key'];
        $cart_content = WC()->cart->get_cart_for_session();
        set_transient($cart_key, $cart_content, 60 * 60 * 24); // 24시간 유지
    }
});

// 게스트 카트 데이터 복원
add_action('woocommerce_cart_loaded_from_session', function() {
    if (!is_user_logged_in() && isset($_SESSION['guest_cart_key'])) {
        $cart_key = 'guest_cart_' . $_SESSION['guest_cart_key'];
        $cart_content = get_transient($cart_key);
        if ($cart_content) {
            WC()->cart->set_cart_contents($cart_content);
        }
    }
});