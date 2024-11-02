<?php

// 회원가입 폼 커스터마이즈
add_filter('register_form', 'custom_registration_form');
function custom_registration_form() {
    // 추가 필드 예시
    ?>
    <p>
        <label for="phone">전화번호</label>
        <input type="tel" name="phone" id="phone" class="input" />
    </p>
    <?php
}

// 회원가입 처리 시 추가 필드 저장
add_action('user_register', 'save_custom_registration_fields');
function save_custom_registration_fields($user_id) {
    if (!empty($_POST['phone'])) {
        update_user_meta($user_id, 'phone', sanitize_text_field($_POST['phone']));
    }
} 